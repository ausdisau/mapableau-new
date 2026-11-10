import type { BillingFundingSourceType } from "@prisma/client";
import { z } from "zod";

import { checkoutDecisionForFundingType } from "@/lib/billing/core/funding-logic";
import { syncInvoiceToXero } from "@/lib/billing/integrations/xero-facade";
import { integrationsFeatureFlags } from "@/lib/integrations/config/feature-flags";
import { enqueueIntegrationDelivery } from "@/lib/integrations/delivery/outbox-service";
import {
  createUnpublishedDraftRoster,
  updateUnpublishedDraftRoster,
} from "@/lib/integrations/deputy/roster";
import { prisma } from "@/lib/prisma";

export const careFinanceStepSchema = z.enum([
  "deputy_draft_roster",
  "billing_review",
  "xero_draft_invoice",
  "funding_collection",
  "compensate_cancel",
]);

export type CareFinanceStep = z.infer<typeof careFinanceStepSchema>;

export type CareFinanceStatus = {
  organisationId: string;
  careBookingId: string;
  careShiftId?: string;
  steps: Array<{
    step: CareFinanceStep;
    state: "pending" | "running" | "done" | "failed" | "skipped" | "needs_review";
    detail?: string;
  }>;
  fundingDecision?: ReturnType<typeof checkoutDecisionForFundingType>;
  stripeCheckoutEligible: boolean;
  humanReviewRequired: true;
};

/**
 * Feature-flagged Care → Deputy → evidence → Xero → funding branch orchestration.
 * Does not publish rosters, authorise invoices, or charge cards automatically.
 */
export async function runCareFinanceSlice(input: {
  organisationId: string;
  careBookingId: string;
  careShiftId: string;
  workerProfileId: string;
  billingInvoiceId?: string;
  fundingSourceType?: BillingFundingSourceType | null;
  actorUserId: string;
}): Promise<CareFinanceStatus> {
  const status: CareFinanceStatus = {
    organisationId: input.organisationId,
    careBookingId: input.careBookingId,
    careShiftId: input.careShiftId,
    steps: [],
    stripeCheckoutEligible: false,
    humanReviewRequired: true,
  };

  if (!integrationsFeatureFlags.stripeDirectBookingEnabled()) {
    status.steps.push({
      step: "funding_collection",
      state: "skipped",
      detail: "STRIPE_DIRECT_BOOKING_ENABLED is false (default)",
    });
  }

  // 1) Deputy draft roster (unpublished)
  const shift = await prisma.careShift.findFirst({
    where: {
      id: input.careShiftId,
      organisationId: input.organisationId,
      careBookingId: input.careBookingId,
    },
  });

  if (!shift) {
    status.steps.push({
      step: "deputy_draft_roster",
      state: "failed",
      detail: "Care shift not found for organisation (tenant isolation)",
    });
    return status;
  }

  try {
    const roster = await createUnpublishedDraftRoster({
      organisationId: input.organisationId,
      careShiftId: shift.id,
      workerProfileId: input.workerProfileId,
      startAt: shift.startAt,
      endAt: shift.endAt,
      mealBreakMinutes: 0,
    });
    status.steps.push({
      step: "deputy_draft_roster",
      state:
        roster.status === "created" ||
        roster.status === "already_mapped" ||
        roster.status === "dry_run" ||
        roster.status === "enqueued"
          ? "done"
          : roster.status === "needs_mapping"
            ? "needs_review"
            : "skipped",
      detail: JSON.stringify(roster),
    });
  } catch (err) {
    status.steps.push({
      step: "deputy_draft_roster",
      state: "failed",
      detail: err instanceof Error ? err.message : String(err),
    });
  }

  // 2) Billing review gate — never skip human review
  status.steps.push({
    step: "billing_review",
    state: "needs_review",
    detail:
      "Participant/provider billing review required before Xero draft or Stripe Checkout",
  });

  // 3) Xero draft (only if invoice provided and review assumed by caller)
  if (input.billingInvoiceId) {
    try {
      const xero = await syncInvoiceToXero({
        invoiceId: input.billingInvoiceId,
        organisationId: input.organisationId,
        actorId: input.actorUserId,
        idempotencyKey: `care-finance:${input.billingInvoiceId}`,
      });
      status.steps.push({
        step: "xero_draft_invoice",
        state: xero.ok ? "done" : "failed",
        detail: xero.message,
      });
    } catch (err) {
      status.steps.push({
        step: "xero_draft_invoice",
        state: "failed",
        detail: err instanceof Error ? err.message : String(err),
      });
    }
  } else {
    status.steps.push({
      step: "xero_draft_invoice",
      state: "pending",
      detail: "Awaiting MapAble BillingInvoice DRAFT after evidence approval",
    });
  }

  // 4) Funding branch
  const decision = checkoutDecisionForFundingType(input.fundingSourceType);
  status.fundingDecision = decision;
  status.stripeCheckoutEligible =
    decision.allowed &&
    integrationsFeatureFlags.stripeDirectBookingEnabled();

  if (!decision.allowed) {
    status.steps.push({
      step: "funding_collection",
      state: "skipped",
      detail:
        decision.reason === "plan_managed"
          ? "Plan-manager export path — no Stripe Checkout"
          : decision.instruction,
    });
  } else if (!integrationsFeatureFlags.stripeDirectBookingEnabled()) {
    status.steps.push({
      step: "funding_collection",
      state: "skipped",
      detail:
        "Checkout eligible funding, but STRIPE_DIRECT_BOOKING_ENABLED is false",
    });
  } else {
    status.steps.push({
      step: "funding_collection",
      state: "needs_review",
      detail:
        "Use existing Stripe Checkout APIs after human authorisation — do not duplicate charges",
    });
  }

  return status;
}

/**
 * Compensating actions for cancel / decline / no-show / dispute.
 * Never automatic blanket refund or worker removal.
 */
export async function compensateCareFinanceChange(input: {
  organisationId: string;
  careShiftId: string;
  reason: "cancelled" | "declined" | "changed" | "no_show" | "disputed";
  actorUserId: string;
  holdInvoiceId?: string;
}): Promise<{
  deputy: "updated" | "skipped" | "needs_review" | "failed";
  invoice: "held" | "skipped";
  notify: true;
  detail: string;
}> {
  let deputy: "updated" | "skipped" | "needs_review" | "failed" = "skipped";
  let detail = "";

  try {
    const shift = await prisma.careShift.findFirst({
      where: {
        id: input.careShiftId,
        organisationId: input.organisationId,
      },
    });
    if (!shift) {
      return {
        deputy: "failed",
        invoice: "skipped",
        notify: true,
        detail: "Shift not found for organisation",
      };
    }

    if (integrationsFeatureFlags.deputyEnabled()) {
      // Keep unpublished; update times if changed — never auto-publish.
      const result = await updateUnpublishedDraftRoster({
        organisationId: input.organisationId,
        careShiftId: input.careShiftId,
        startAt: shift.startAt,
        endAt: shift.endAt,
        publish: false,
      });
      deputy = result.status === "dry_run" ? "skipped" : "updated";
      detail = `Deputy draft compensation: ${result.status}`;
    }
  } catch (err) {
    deputy = "needs_review";
    detail = err instanceof Error ? err.message : String(err);
  }

  let invoice: "held" | "skipped" = "skipped";
  if (input.holdInvoiceId) {
    await prisma.billingInvoice.updateMany({
      where: {
        id: input.holdInvoiceId,
        providerId: input.organisationId,
        status: { in: ["draft", "pending_payment"] },
      },
      data: {
        notesForBilling: `Held due to ${input.reason} — human review required before charge/refund`,
      },
    });
    invoice = "held";
  }

  await enqueueIntegrationDelivery({
    eventId: `compensate:${input.careShiftId}:${input.reason}`,
    aggregateType: "care_shift",
    aggregateId: input.careShiftId,
    aggregateRevision: 1,
    provider: "deputy",
    organisationId: input.organisationId,
    dedupeKey: `compensate:${input.organisationId}:${input.careShiftId}:${input.reason}`,
    payloadRef: { careShiftId: input.careShiftId },
  });

  return { deputy, invoice, notify: true, detail };
}

/** Prevent double Stripe collection when plan-manager path selected. */
export function assertNoStripeWhenPlanManaged(
  fundingSourceType: BillingFundingSourceType | null | undefined,
): void {
  const decision = checkoutDecisionForFundingType(fundingSourceType);
  if (!decision.allowed && decision.reason === "plan_managed") {
    throw new Error(
      "Stripe Checkout is prohibited for ndis_plan_managed invoices",
    );
  }
  if (fundingSourceType === "ndis_agency_managed") {
    throw new Error(
      "Stripe Checkout is prohibited for ndis_agency_managed claiming",
    );
  }
}
