import type { NdisCorrectionType, Prisma } from "@prisma/client";

import { findDuplicateBySourceKey } from "@/lib/ndis-gateway/billing/billable-item-deduplication";
import { multiplyQuantityCents } from "@/lib/ndis-gateway/billing/money";
import { projectBillableItemSafe } from "@/lib/ndis-gateway/billing/billable-item-service";
import { buildBillableSourceKey } from "@/lib/ndis-gateway/billing/source-key";
import { createCorrelationId } from "@/lib/ndis-gateway/infrastructure/correlation";
import { sanitiseAuditJson } from "@/lib/ndis-gateway/security/log-sanitiser";
import { prisma } from "@/lib/prisma";

export type CreateReplacementBillableItemInput = {
  organisationId: string;
  originalBillableItemId: string;
  actorUserId: string;
  correctionType: NdisCorrectionType;
  reason: string;
  patches: {
    supportItemCode?: string | null;
    supportDescription?: string;
    serviceStartAt?: Date;
    serviceEndAt?: Date;
    quantity?: number | string;
    unitPriceCents?: number;
    unitType?: string;
  };
};

/**
 * Create a replacement billable item and mark the original as corrected/superseded.
 */
export async function createReplacementBillableItem(
  input: CreateReplacementBillableItemInput
) {
  if (!input.reason.trim()) {
    throw new Error("CORRECTION_REASON_REQUIRED");
  }

  const original = await prisma.ndisBillableServiceItem.findFirst({
    where: {
      id: input.originalBillableItemId,
      organisationId: input.organisationId,
    },
  });
  if (!original) throw new Error("BILLABLE_ITEM_NOT_FOUND");
  if (original.status === "voided" || original.status === "corrected") {
    throw new Error("BILLABLE_ITEM_NOT_CORRECTABLE");
  }

  const nextGeneration = original.correctionGeneration + 1;
  const serviceStartAt = input.patches.serviceStartAt ?? original.serviceStartAt;
  const serviceEndAt = input.patches.serviceEndAt ?? original.serviceEndAt;
  const supportItemCode =
    input.patches.supportItemCode !== undefined
      ? input.patches.supportItemCode
      : original.supportItemCode;
  const quantity = input.patches.quantity ?? original.quantity;
  const unitPriceCents =
    input.patches.unitPriceCents ?? original.unitPriceCents ?? 0;

  if (supportItemCode?.toUpperCase() === "PENDING_CODE") {
    throw new Error("PENDING_CODE_REFUSED");
  }
  if (unitPriceCents === 0 && original.billingRoute !== "pro_bono") {
    throw new Error("ZERO_PRICE_REFUSED");
  }

  const sourceKey = buildBillableSourceKey({
    organisationId: input.organisationId,
    participantId: original.participantId,
    sourceType: "correction",
    sourceId: original.id,
    chargeType: original.chargeType,
    serviceStartAtIso: serviceStartAt.toISOString(),
    supportItemCode,
    correctionGeneration: nextGeneration,
  });

  const existing = await findDuplicateBySourceKey(
    prisma,
    input.organisationId,
    sourceKey
  );
  if (existing) {
    return {
      original: projectBillableItemSafe(original),
      replacement: projectBillableItemSafe(existing),
      idempotent: true,
    };
  }

  const subtotalCents = multiplyQuantityCents(quantity, unitPriceCents);
  const correlationId = createCorrelationId();

  const result = await prisma.$transaction(async (tx) => {
    const replacement = await tx.ndisBillableServiceItem.create({
      data: {
        organisationId: input.organisationId,
        participantId: original.participantId,
        serviceAgreementId: original.serviceAgreementId,
        fundingSourceId: original.fundingSourceId,
        bookingId: original.bookingId,
        careShiftId: original.careShiftId,
        timesheetId: original.timesheetId,
        deliveryEventId: original.deliveryEventId,
        correctedFromId: original.id,
        billingRoute: original.billingRoute,
        ndisPaymentRoute: original.ndisPaymentRoute,
        paymentDestination: original.paymentDestination,
        chargeType: original.chargeType,
        supportItemCode,
        supportDescription:
          input.patches.supportDescription ?? original.supportDescription,
        claimType: original.claimType,
        deliveryMechanism: original.deliveryMechanism,
        serviceStartAt,
        serviceEndAt,
        serviceTimezone: original.serviceTimezone,
        quantity,
        unitType: input.patches.unitType ?? original.unitType,
        agreedUnitPriceCents: original.agreedUnitPriceCents,
        resolvedMaximumPriceCents: original.resolvedMaximumPriceCents,
        unitPriceCents,
        subtotalCents,
        gstCents: original.gstCents,
        totalCents: subtotalCents,
        pricingReleaseId: original.pricingReleaseId,
        pricingRowId: original.pricingRowId,
        pricingResolverVersion: original.pricingResolverVersion,
        pricingProvenanceJson: original.pricingProvenanceJson ?? undefined,
        status: "draft",
        sourceKey,
        correctionGeneration: nextGeneration,
        createdById: input.actorUserId,
        blockingIssuesJson: [] as Prisma.InputJsonValue,
        warningsJson: sanitiseAuditJson({
          correctionType: input.correctionType,
          reason: input.reason,
        }) as Prisma.InputJsonValue,
      },
    });

    await tx.ndisBillableServiceItem.update({
      where: { id: original.id },
      data: {
        status: "corrected",
        supersededById: replacement.id,
        supersededAt: new Date(),
      },
    });

    await tx.ndisWorkflowTransition.create({
      data: {
        organisationId: input.organisationId,
        entityType: "ndis_billable_service_item",
        entityId: original.id,
        fromStatus: original.status,
        toStatus: "corrected",
        actorUserId: input.actorUserId,
        reason: input.reason,
        correlationId,
        metadataJson: sanitiseAuditJson({
          correctionType: input.correctionType,
          replacementId: replacement.id,
        }) as Prisma.InputJsonValue,
      },
    });

    return replacement;
  });

  const refreshedOriginal = await prisma.ndisBillableServiceItem.findUniqueOrThrow(
    { where: { id: original.id } }
  );

  return {
    original: projectBillableItemSafe(refreshedOriginal),
    replacement: projectBillableItemSafe(result),
    idempotent: false,
  };
}
