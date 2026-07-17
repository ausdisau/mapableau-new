import type { ParticipantWallet } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

/**
 * Wallets are participant-owned. A wallet is never auto-activated. The
 * participant must call `activateWallet` themselves after confirming a
 * recovery policy.
 *
 * AI cannot complete high-risk recovery (see `recovery.ts`).
 */

export async function getOrDraftWallet(
  participantId: string
): Promise<ParticipantWallet> {
  const existing = await prisma.participantWallet.findUnique({
    where: { participantId },
  });
  if (existing) return existing;
  return prisma.participantWallet.create({
    data: { participantId, activationStatus: "not_activated" },
  });
}

export async function activateWallet(input: {
  participantId: string;
  actorId: string;
  recoveryPolicyId: string;
}): Promise<ParticipantWallet> {
  if (input.actorId !== input.participantId) {
    throw new Error("wallet_activation_requires_participant_actor");
  }
  const wallet = await getOrDraftWallet(input.participantId);
  const policy = await prisma.walletRecoveryPolicy.findUnique({
    where: { id: input.recoveryPolicyId },
  });
  if (!policy) throw new Error("recovery_policy_required_before_activation");

  const updated = await prisma.participantWallet.update({
    where: { id: wallet.id },
    data: {
      activationStatus: "active",
      activationConfirmedAt: wallet.activationConfirmedAt ?? new Date(),
      recoveryPolicyId: policy.id,
    },
  });
  await createAuditEvent({
    actorUserId: input.actorId,
    action: "wallet.activated",
    entityType: "ParticipantWallet",
    entityId: updated.id,
    participantId: input.participantId,
  }).catch(() => {});
  return updated;
}

export async function suspendWallet(
  participantId: string,
  actorId: string,
  reason: string
): Promise<ParticipantWallet> {
  const wallet = await getOrDraftWallet(participantId);
  const updated = await prisma.participantWallet.update({
    where: { id: wallet.id },
    data: { activationStatus: "suspended" },
  });
  await createAuditEvent({
    actorUserId: actorId,
    action: "wallet.suspended",
    entityType: "ParticipantWallet",
    entityId: updated.id,
    participantId,
    metadata: { reason },
  }).catch(() => {});
  return updated;
}
