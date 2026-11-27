import { createDeputyDraftShift } from "@/lib/integrations/deputy/draft-shift";
import { isDeputyEnabled } from "@/lib/integrations/deputy/flags";
import { integrationOutboxFlags } from "@/lib/integrations/outbox/flags";
import { enqueueIntegrationOutbox } from "@/lib/integrations/outbox/memory-outbox";
import { createXeroDraftAccrec } from "@/lib/integrations/xero/draft-accrec";
import { isXeroDirectEnabled } from "@/lib/integrations/xero/flags";

export type FundingBranch =
  | "private_pay"
  | "ndis_self_managed"
  | "ndis_plan_managed"
  | "ndis_agency_managed";

export type CareFinanceSandboxInput = {
  organisationId: string;
  careBookingId: string;
  careShiftId: string;
  workerProfileId: string;
  billingInvoiceId: string;
  fundingBranch: FundingBranch;
  /** Mapped Deputy employee — required when Deputy sync applies. */
  deputyEmployeeId?: number;
  operationalUnitId?: number;
  startTimestamp: number;
  endTimestamp: number;
  xeroContactId?: string;
  xeroAccountCode?: string;
  xeroTaxType?: string;
  unitAmountCents: number;
  quantity: number;
  serviceEvidenceReviewed: boolean;
  participantBillingReviewed: boolean;
};

export type CareFinanceSandboxResult = {
  ok: boolean;
  stages: {
    deputy: { status: string; detail?: string };
    invoice: { status: string; detail?: string };
    xero: { status: string; detail?: string };
    collection: { status: string; detail?: string };
  };
  humanReviewRequired: string[];
  productionClaim: "none";
};

/**
 * Sandbox vertical slice: confirmed care → Deputy draft → reviewed evidence →
 * Xero draft → funding-appropriate collection path.
 * Never publishes rosters, authorises invoices, or charges cards live.
 */
export async function runCareFinanceSandboxSlice(
  input: CareFinanceSandboxInput,
): Promise<CareFinanceSandboxResult> {
  const humanReviewRequired: string[] = [];
  const stages: CareFinanceSandboxResult["stages"] = {
    deputy: { status: "skipped" },
    invoice: { status: "pending_review" },
    xero: { status: "skipped" },
    collection: { status: "blocked" },
  };

  if (!input.serviceEvidenceReviewed || !input.participantBillingReviewed) {
    humanReviewRequired.push("service_or_billing_review_incomplete");
    return {
      ok: false,
      stages,
      humanReviewRequired,
      productionClaim: "none",
    };
  }

  stages.invoice = { status: "draft_ready", detail: input.billingInvoiceId };

  if (isDeputyEnabled()) {
    if (
      input.deputyEmployeeId == null ||
      input.operationalUnitId == null
    ) {
      stages.deputy = {
        status: "not_applicable",
        detail: "Missing employee/area mapping — mark not_applicable for independents",
      };
      humanReviewRequired.push("deputy_mapping");
    } else {
      const deputy = await createDeputyDraftShift({
        organisationId: input.organisationId,
        workerProfileId: input.workerProfileId,
        careShiftId: input.careShiftId,
        startTimestamp: input.startTimestamp,
        endTimestamp: input.endTimestamp,
        operationalUnitId: input.operationalUnitId,
        deputyEmployeeId: input.deputyEmployeeId,
        publish: false,
      });
      stages.deputy = deputy.ok
        ? { status: "draft_unpublished", detail: deputy.dryRun ? "dry_run" : "queued" }
        : { status: "denied", detail: deputy.denialReason };
      if (!deputy.ok) humanReviewRequired.push(`deputy:${deputy.denialReason}`);
      enqueueIntegrationOutbox({
        provider: "deputy",
        aggregateType: "CareShift",
        aggregateId: input.careShiftId,
        dedupeKey: `deputy:shift:${input.careShiftId}:draft`,
      });
    }
  } else {
    stages.deputy = { status: "flag_off" };
  }

  if (isXeroDirectEnabled()) {
    const xero = await createXeroDraftAccrec({
      organisationId: input.organisationId,
      billingInvoiceId: input.billingInvoiceId,
      contactId: input.xeroContactId ?? "",
      accountCode: input.xeroAccountCode ?? "",
      lineDescription: `Care booking ${input.careBookingId}`,
      quantity: input.quantity,
      unitAmountCents: input.unitAmountCents,
      currency: "AUD",
      taxType: input.xeroTaxType ?? "",
      dedupeKey: `xero:${input.billingInvoiceId}:v1`,
    });
    stages.xero = xero.ok
      ? { status: "draft_accrec", detail: xero.dryRun ? "dry_run" : "queued" }
      : { status: "denied", detail: xero.denialReason };
    if (!xero.ok) humanReviewRequired.push(`xero:${xero.denialReason}`);
    enqueueIntegrationOutbox({
      provider: "xero",
      aggregateType: "BillingInvoice",
      aggregateId: input.billingInvoiceId,
      dedupeKey: `xero:${input.billingInvoiceId}:draft`,
    });
  } else {
    stages.xero = { status: "flag_off" };
  }

  switch (input.fundingBranch) {
    case "private_pay":
    case "ndis_self_managed":
      stages.collection = {
        status: integrationOutboxFlags.stripeDirectBookingEnabled
          ? "stripe_checkout_eligible_sandbox"
          : "stripe_flag_off",
        detail:
          "Use existing Stripe Checkout only after human review; never treat return URL as paid",
      };
      if (!integrationOutboxFlags.stripeDirectBookingEnabled) {
        humanReviewRequired.push("stripe_direct_booking_disabled");
      }
      break;
    case "ndis_plan_managed":
      stages.collection = {
        status: "plan_manager_invoice_export",
        detail: "No Stripe Checkout for plan-managed funding",
      };
      humanReviewRequired.push("plan_manager_export_review");
      break;
    case "ndis_agency_managed":
      stages.collection = {
        status: "agency_claim_independent",
        detail: "Agency-managed NDIS claiming remains outside this slice",
      };
      humanReviewRequired.push("agency_managed_path");
      break;
    default: {
      const _exhaustive: never = input.fundingBranch;
      void _exhaustive;
      stages.collection = { status: "unknown_funding" };
      humanReviewRequired.push("unknown_funding");
    }
  }

  return {
    ok: humanReviewRequired.length === 0,
    stages,
    humanReviewRequired,
    productionClaim: "none",
  };
}
