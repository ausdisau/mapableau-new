import type { NdisChargeType, Prisma } from "@prisma/client";

import { findDuplicateBySourceKey } from "@/lib/ndis-gateway/billing/billable-item-deduplication";
import { multiplyQuantityCents } from "@/lib/ndis-gateway/billing/money";
import {
  projectBillableItemSafe,
  type SafeBillableItemView,
} from "@/lib/ndis-gateway/billing/billable-item-service";
import { buildBillableSourceKey } from "@/lib/ndis-gateway/billing/source-key";
import { validateBillableItemDraft } from "@/lib/ndis-gateway/billing/billable-item-validator";
import { createDraftEvidencePackage } from "@/lib/ndis-gateway/evidence/evidence-package-service";
import { createCorrelationId } from "@/lib/ndis-gateway/infrastructure/correlation";
import { resolvePriceForServiceDate } from "@/lib/ndis-gateway/pricing/price-resolution-bridge";
import type { AllowZeroPriceReason } from "@/lib/ndis-gateway/pricing/price-resolution-types";
import { resolveBillingRouteForOrganisation } from "@/lib/ndis-gateway/routing/route-decision-service";
import { sanitiseAuditJson } from "@/lib/ndis-gateway/security/log-sanitiser";
import { prisma } from "@/lib/prisma";

export type BillableSourceType =
  | "booking"
  | "care_shift"
  | "timesheet"
  | "delivery_event"
  | "manual";

export type CreateBillableItemsFromServiceInput = {
  organisationId: string;
  createdById: string;
  sourceType: BillableSourceType;
  sourceId: string;
  /** Required for manual; optional override for others. */
  participantId?: string;
  supportItemCode?: string;
  supportDescription?: string;
  serviceStartAt?: Date;
  serviceEndAt?: Date;
  quantity?: number;
  unitType?: string;
  unitPriceCents?: number;
  chargeType?: NdisChargeType;
  allowZeroPriceReason?: AllowZeroPriceReason | null;
  clientRequestedRoute?: Parameters<
    typeof resolveBillingRouteForOrganisation
  >[0]["clientRequestedRoute"];
  allowClientOverride?: boolean;
  overrideReason?: string | null;
};

export type CreateBillableItemsFromServiceResult = {
  correlationId: string;
  idempotent: boolean;
  items: SafeBillableItemView[];
  blockingIssues: string[];
};

/**
 * Create billable item(s) from a completed service source.
 * NEVER decrypts NDIS numbers. Returns safe projections only.
 */
export async function createBillableItemsFromService(
  input: CreateBillableItemsFromServiceInput
): Promise<CreateBillableItemsFromServiceResult> {
  const correlationId = createCorrelationId();
  const chargeType = input.chargeType ?? "support";

  let participantId = input.participantId ?? null;
  let bookingId: string | null = null;
  let careShiftId: string | null = null;
  let timesheetId: string | null = null;
  let deliveryEventId: string | null = null;
  let fundingSourceType: Parameters<
    typeof resolveBillingRouteForOrganisation
  >[0]["fundingSourceType"] = null;
  let serviceStartAt = input.serviceStartAt;
  let serviceEndAt = input.serviceEndAt;
  let supportItemCode = input.supportItemCode?.trim() ?? null;
  let supportDescription =
    input.supportDescription?.trim() || "NDIS support service";
  let quantity = input.quantity ?? 1;
  let unitPriceCents = input.unitPriceCents;
  const references: Array<{
    referenceType: string;
    referenceId: string;
    safeLabel: string;
  }> = [];

  if (input.sourceType === "booking") {
    const booking = await prisma.booking.findUnique({
      where: { id: input.sourceId },
      include: {
        fundingSource: true,
        careRequest: true,
        careShifts: {
          where: { status: { in: ["completed", "checked_out"] } },
          take: 5,
          orderBy: { startAt: "desc" },
        },
      },
    });
    if (!booking) throw new Error("BOOKING_NOT_FOUND");
    if (booking.assignedOrganisationId !== input.organisationId) {
      throw new Error("BOOKING_ORG_MISMATCH");
    }
    if (booking.status !== "completed") {
      throw new Error("BOOKING_NOT_COMPLETED");
    }

    participantId = booking.participantId;
    bookingId = booking.id;
    fundingSourceType = booking.fundingSource?.type ?? null;
    const shift = booking.careShifts[0];
    careShiftId = shift?.id ?? null;
    serviceStartAt = serviceStartAt ?? shift?.startAt ?? booking.requestedStart;
    serviceEndAt =
      serviceEndAt ?? shift?.endAt ?? booking.requestedEnd ?? serviceStartAt;
    supportItemCode =
      supportItemCode ?? booking.careRequest?.supportItemCode ?? null;
    supportDescription =
      input.supportDescription?.trim() ||
      (supportItemCode
        ? `Support — ${supportItemCode}`
        : `Booking ${booking.id.slice(0, 8)}`);
    references.push({
      referenceType: "booking",
      referenceId: booking.id,
      safeLabel: "Completed booking",
    });
    if (shift) {
      references.push({
        referenceType: "care_shift",
        referenceId: shift.id,
        safeLabel: "Completed care shift",
      });
    }
  } else if (input.sourceType === "care_shift") {
    careShiftId = input.sourceId;
    references.push({
      referenceType: "care_shift",
      referenceId: input.sourceId,
      safeLabel: "Care shift",
    });
  } else if (input.sourceType === "timesheet") {
    timesheetId = input.sourceId;
    references.push({
      referenceType: "timesheet",
      referenceId: input.sourceId,
      safeLabel: "Timesheet",
    });
  } else if (input.sourceType === "delivery_event") {
    deliveryEventId = input.sourceId;
    references.push({
      referenceType: "delivery_event",
      referenceId: input.sourceId,
      safeLabel: "Delivery event",
    });
  } else if (input.sourceType === "manual") {
    if (!participantId) throw new Error("PARTICIPANT_REQUIRED_FOR_MANUAL");
    references.push({
      referenceType: "manual",
      referenceId: input.sourceId,
      safeLabel: "Manual billable entry",
    });
  } else {
    const _exhaustive: never = input.sourceType;
    throw new Error(`UNSUPPORTED_SOURCE_TYPE:${String(_exhaustive)}`);
  }

  if (!serviceStartAt || !serviceEndAt) {
    throw new Error("SERVICE_DATES_REQUIRED");
  }
  if (!participantId) {
    throw new Error("PARTICIPANT_REQUIRED");
  }
  if (!supportItemCode || supportItemCode.toUpperCase() === "PENDING_CODE") {
    throw new Error("PENDING_CODE_REFUSED");
  }
  if (unitPriceCents == null) {
    throw new Error("UNIT_PRICE_REQUIRED");
  }
  if (unitPriceCents === 0 && !input.allowZeroPriceReason) {
    throw new Error("ZERO_PRICE_REFUSED");
  }

  const route = await resolveBillingRouteForOrganisation({
    organisationId: input.organisationId,
    fundingSourceType,
    clientRequestedRoute: input.clientRequestedRoute,
    allowClientOverride: input.allowClientOverride,
    overrideReason: input.overrideReason,
  });

  if (route.blocked) {
    return {
      correlationId,
      idempotent: false,
      items: [],
      blockingIssues: route.blockingIssues,
    };
  }

  const price = await resolvePriceForServiceDate({
    supportItemCode,
    serviceStartAt,
    proposedUnitPriceCents: unitPriceCents,
    paymentRoute: route.ndisPaymentRoute,
    allowZeroPriceReason: input.allowZeroPriceReason,
  });

  if (!price.ok) {
    return {
      correlationId,
      idempotent: false,
      items: [],
      blockingIssues: [`${price.code}: ${price.message}`],
    };
  }

  const sourceKey = buildBillableSourceKey({
    organisationId: input.organisationId,
    participantId,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    chargeType,
    serviceStartAtIso: serviceStartAt.toISOString(),
    supportItemCode: price.supportItemCode,
    correctionGeneration: 0,
  });

  const duplicate = await findDuplicateBySourceKey(
    prisma,
    input.organisationId,
    sourceKey
  );
  if (duplicate) {
    return {
      correlationId,
      idempotent: true,
      items: [projectBillableItemSafe(duplicate)],
      blockingIssues: [],
    };
  }

  const subtotalCents = multiplyQuantityCents(quantity, price.unitPriceCents);
  const draftValidation = validateBillableItemDraft({
    billingRoute: route.billingRoute,
    ndisPaymentRoute: route.ndisPaymentRoute,
    participantId,
    supportItemCode: price.supportItemCode,
    serviceStartAt,
    serviceEndAt,
    unitPriceCents: price.unitPriceCents,
    totalCents: subtotalCents,
    allowZeroPriceReason: input.allowZeroPriceReason,
    pricingProvenanceJson: price.provenance,
    statusTarget: "draft",
  });

  const item = await prisma.ndisBillableServiceItem.create({
    data: {
      organisationId: input.organisationId,
      participantId,
      bookingId,
      careShiftId,
      timesheetId,
      deliveryEventId,
      billingRoute: route.billingRoute,
      ndisPaymentRoute: route.ndisPaymentRoute,
      paymentDestination: route.paymentDestination,
      chargeType,
      supportItemCode: price.supportItemCode,
      supportDescription,
      serviceStartAt,
      serviceEndAt,
      quantity,
      unitType: input.unitType ?? "hour",
      agreedUnitPriceCents: unitPriceCents,
      resolvedMaximumPriceCents: price.priceLimitCents,
      unitPriceCents: price.unitPriceCents,
      subtotalCents,
      gstCents: 0,
      totalCents: subtotalCents,
      pricingRowId: price.pricingRowId,
      pricingResolverVersion: price.pricingResolverVersion,
      pricingProvenanceJson: sanitiseAuditJson(
        price.provenance as unknown as Record<string, unknown>
      ) as Prisma.InputJsonValue,
      status: draftValidation.valid ? "draft" : "validation_failed",
      sourceKey,
      correctionGeneration: 0,
      createdById: input.createdById,
      blockingIssuesJson: draftValidation.blockingIssues as Prisma.InputJsonValue,
      warningsJson: draftValidation.warnings as Prisma.InputJsonValue,
    },
  });

  await createDraftEvidencePackage({
    organisationId: input.organisationId,
    participantId,
    billableItemId: item.id,
    serviceStartAt,
    serviceEndAt,
    supportItemCode: price.supportItemCode,
    quantity,
    bookingId,
    shiftId: careShiftId,
    timesheetId,
    deliveryEventId,
    references,
  });

  await prisma.ndisWorkflowTransition.create({
    data: {
      organisationId: input.organisationId,
      entityType: "ndis_billable_service_item",
      entityId: item.id,
      fromStatus: "none",
      toStatus: item.status,
      actorUserId: input.createdById,
      correlationId,
      metadataJson: sanitiseAuditJson({
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        sourceKey,
      }) as Prisma.InputJsonValue,
    },
  });

  return {
    correlationId,
    idempotent: false,
    items: [projectBillableItemSafe(item)],
    blockingIssues: draftValidation.blockingIssues.map((i) => i.code),
  };
}
