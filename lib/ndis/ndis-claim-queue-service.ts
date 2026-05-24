import type { NdisClaimQueueStatus } from "@prisma/client";
import { createHash, randomUUID } from "crypto";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { callAdapter, getActiveAdapterType } from "@/lib/ndis/ndis-integration-service";
import { getNdisAdapter } from "@/lib/ndis/ndis-client";
import { prisma } from "@/lib/prisma";

export async function createClaimDraft(params: {
  participantId: string;
  organisationId: string;
  invoiceRef?: string;
  serviceLogRef?: string;
  actorId: string;
}) {
  const claim = await prisma.ndisClaimQueueItem.create({
    data: {
      participantId: params.participantId,
      organisationId: params.organisationId,
      status: "draft",
      invoiceRef: params.invoiceRef,
      serviceLogRef: params.serviceLogRef,
      events: {
        create: { status: "draft", actorId: params.actorId },
      },
    },
  });

  await createAuditEvent({
    actorUserId: params.actorId,
    action: "ndis.claim_draft_created",
    entityType: "NdisClaimQueueItem",
    entityId: claim.id,
    participantId: params.participantId,
  });

  return claim;
}

export async function advanceClaimStatus(
  claimId: string,
  nextStatus: NdisClaimQueueStatus,
  actorId: string
) {
  if (nextStatus === "ready_for_review") {
    const claim = await prisma.ndisClaimQueueItem.findUnique({
      where: { id: claimId },
    });
    if (!claim?.serviceLogRef) {
      throw new Error("SERVICE_LOG_REQUIRED");
    }
  }

  const updated = await prisma.ndisClaimQueueItem.update({
    where: { id: claimId },
    data: { status: nextStatus },
  });

  await prisma.ndisClaimEvent.create({
    data: { claimId, status: nextStatus, actorId },
  });

  await createAuditEvent({
    actorUserId: actorId,
    action: "ndis.claim_status_changed",
    entityType: "NdisClaimQueueItem",
    entityId: claimId,
    metadata: { status: nextStatus },
  });

  return updated;
}

export async function submitClaimMock(claimId: string, actorId: string) {
  const claim = await prisma.ndisClaimQueueItem.findUnique({
    where: { id: claimId },
  });
  if (!claim) throw new Error("NOT_FOUND");
  if (claim.status !== "participant_approved" && claim.status !== "queued_for_submission") {
    throw new Error("INVALID_STATUS_FOR_SUBMIT");
  }

  const idempotencyKey =
    claim.idempotencyKey ??
    createHash("sha256").update(claimId).digest("hex").slice(0, 32);

  const existing = await prisma.ndisClaimQueueItem.findUnique({
    where: { idempotencyKey },
  });
  if (existing && existing.id !== claimId && existing.status === "submitted") {
    throw new Error("DUPLICATE_SUBMISSION");
  }

  const adapterType = await getActiveAdapterType();
  const adapter = getNdisAdapter(adapterType);

  const result = await callAdapter("createClaimOrPaymentRequest", () =>
    adapter.createClaimOrPaymentRequest({ claimId })
  );

  const updated = await prisma.ndisClaimQueueItem.update({
    where: { id: claimId },
    data: {
      status: "submitted",
      idempotencyKey,
      externalRef: result.externalClaimId,
      submittedAt: new Date(),
    },
  });

  await prisma.ndisClaimEvent.create({
    data: { claimId, status: "submitted", actorId, notes: result.externalClaimId },
  });

  await prisma.ndisExternalReference.upsert({
    where: {
      internalType_internalId_adapterType: {
        internalType: "NdisClaimQueueItem",
        internalId: claimId,
        adapterType,
      },
    },
    create: {
      internalType: "NdisClaimQueueItem",
      internalId: claimId,
      externalId: result.externalClaimId,
      adapterType,
    },
    update: { externalId: result.externalClaimId },
  });

  return updated;
}

export function generateIdempotencyKey(): string {
  return randomUUID().replace(/-/g, "");
}
