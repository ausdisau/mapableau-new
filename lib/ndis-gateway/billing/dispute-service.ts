import type {
  NdisBillingDisputeCategory,
  NdisBillingDisputeStatus,
  Prisma,
} from "@prisma/client";

import {
  assertDisputeTransition,
  disputeOpensWithPaymentHold,
} from "@/lib/ndis-gateway/billing/dispute-policy";
import {
  mayParticipantRaiseDispute,
  sanitizeDisputeDescription,
  shouldHoldPaymentOnDispute,
} from "@/lib/ndis-gateway/billing/participant-safeguards";
import { createCorrelationId } from "@/lib/ndis-gateway/infrastructure/correlation";
import { sanitiseAuditJson } from "@/lib/ndis-gateway/security/log-sanitiser";
import { prisma } from "@/lib/prisma";

export async function raiseBillingDispute(input: {
  organisationId: string;
  participantId: string;
  raisedById: string;
  category: NdisBillingDisputeCategory;
  description: string;
  billableItemId?: string | null;
  documentId?: string | null;
  claimSnapshotId?: string | null;
  /** When true, enforce participant match on billable item. */
  enforceParticipantActor?: boolean;
}) {
  const description = sanitizeDisputeDescription(input.description);
  if (!description) throw new Error("DISPUTE_DESCRIPTION_REQUIRED");

  if (input.billableItemId) {
    const item = await prisma.ndisBillableServiceItem.findFirst({
      where: {
        id: input.billableItemId,
        organisationId: input.organisationId,
      },
    });
    if (!item) throw new Error("BILLABLE_ITEM_NOT_FOUND");
    if (
      input.enforceParticipantActor &&
      !mayParticipantRaiseDispute({
        billableItemParticipantId: item.participantId,
        actorParticipantId: input.participantId,
      })
    ) {
      throw new Error("DISPUTE_PARTICIPANT_MISMATCH");
    }
  }

  const paymentHold =
    disputeOpensWithPaymentHold(input.category) && shouldHoldPaymentOnDispute();
  const correlationId = createCorrelationId();

  const dispute = await prisma.$transaction(async (tx) => {
    const created = await tx.ndisBillingDispute.create({
      data: {
        organisationId: input.organisationId,
        participantId: input.participantId,
        billableItemId: input.billableItemId ?? null,
        documentId: input.documentId ?? null,
        claimSnapshotId: input.claimSnapshotId ?? null,
        raisedById: input.raisedById,
        category: input.category,
        description,
        status: "open",
        paymentHold,
      },
    });

    if (input.billableItemId && paymentHold) {
      await tx.ndisBillableServiceItem.update({
        where: { id: input.billableItemId },
        data: {
          paymentHold: true,
          status: "disputed",
        },
      });
    }

    await tx.ndisWorkflowTransition.create({
      data: {
        organisationId: input.organisationId,
        entityType: "ndis_billing_dispute",
        entityId: created.id,
        fromStatus: "none",
        toStatus: "open",
        actorUserId: input.raisedById,
        correlationId,
        metadataJson: sanitiseAuditJson({
          category: input.category,
          paymentHold,
          billableItemId: input.billableItemId ?? null,
        }) as Prisma.InputJsonValue,
      },
    });

    return created;
  });

  return { dispute, correlationId };
}

export async function transitionBillingDispute(input: {
  organisationId: string;
  disputeId: string;
  actorUserId: string;
  toStatus: NdisBillingDisputeStatus;
  resolution?: string | null;
}) {
  const dispute = await prisma.ndisBillingDispute.findFirst({
    where: { id: input.disputeId, organisationId: input.organisationId },
  });
  if (!dispute) throw new Error("DISPUTE_NOT_FOUND");

  assertDisputeTransition(dispute.status, input.toStatus);

  const updated = await prisma.ndisBillingDispute.update({
    where: { id: dispute.id },
    data: {
      status: input.toStatus,
      resolution: input.resolution ?? dispute.resolution,
      resolvedAt:
        input.toStatus === "resolved" || input.toStatus === "withdrawn"
          ? new Date()
          : dispute.resolvedAt,
      paymentHold:
        input.toStatus === "resolved" || input.toStatus === "withdrawn"
          ? false
          : input.toStatus === "payment_held"
            ? true
            : dispute.paymentHold,
    },
  });

  if (
    dispute.billableItemId &&
    (input.toStatus === "resolved" || input.toStatus === "withdrawn")
  ) {
    await prisma.ndisBillableServiceItem.update({
      where: { id: dispute.billableItemId },
      data: { paymentHold: false },
    });
  }

  await prisma.ndisWorkflowTransition.create({
    data: {
      organisationId: input.organisationId,
      entityType: "ndis_billing_dispute",
      entityId: dispute.id,
      fromStatus: dispute.status,
      toStatus: input.toStatus,
      actorUserId: input.actorUserId,
      reason: input.resolution ?? null,
      correlationId: createCorrelationId(),
    },
  });

  return updated;
}
