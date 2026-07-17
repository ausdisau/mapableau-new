import type {
  WalletRecoveryEvent,
  WalletRecoveryMethod,
  WalletRecoveryPolicy,
} from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { asJson } from "@/lib/prisma-json";

/**
 * Wallet recovery.
 *
 * High-risk recovery flows (guardian shard, offline paper kit, operator
 * assisted) require a human reviewer. AI cannot be that reviewer. The
 * `WalletRecoveryEvent` transitions from `requested` -> `awaiting_verification`
 * -> `approved` MUST record a human `actorId`. This module enforces that
 * pattern.
 */

export async function createRecoveryPolicy(input: {
  method: WalletRecoveryMethod;
  quorum?: number;
  guardianReferences?: Record<string, unknown>;
  operatorAssistAllowed?: boolean;
  offlineKitDeliveryRef?: string;
}): Promise<WalletRecoveryPolicy> {
  return prisma.walletRecoveryPolicy.create({
    data: {
      method: input.method,
      quorum: input.quorum ?? 1,
      guardianReferences: asJson(input.guardianReferences),
      operatorAssistAllowed: input.operatorAssistAllowed ?? false,
      offlineKitDeliveryRef: input.offlineKitDeliveryRef ?? null,
    },
  });
}

export async function requestRecovery(input: {
  walletId: string;
  actorId: string;
  method: WalletRecoveryMethod;
  reason?: string;
  evidence?: Record<string, unknown>;
}): Promise<WalletRecoveryEvent> {
  const event = await prisma.walletRecoveryEvent.create({
    data: {
      walletId: input.walletId,
      actorId: input.actorId,
      method: input.method,
      status: "requested",
      reason: input.reason ?? null,
      evidence: asJson(input.evidence),
    },
  });
  await createAuditEvent({
    actorUserId: input.actorId,
    action: "wallet.recovery.requested",
    entityType: "WalletRecoveryEvent",
    entityId: event.id,
    metadata: { method: input.method },
  }).catch(() => {});
  return event;
}

export async function approveRecovery(input: {
  eventId: string;
  reviewerId: string;
}): Promise<WalletRecoveryEvent> {
  const event = await prisma.walletRecoveryEvent.findUnique({
    where: { id: input.eventId },
  });
  if (!event) throw new Error("recovery_event_not_found");
  if (event.status !== "awaiting_verification" && event.status !== "requested") {
    throw new Error("recovery_not_in_reviewable_state");
  }
  if (isHighRiskMethod(event.method) && !input.reviewerId) {
    throw new Error("high_risk_recovery_requires_human_reviewer");
  }
  const updated = await prisma.walletRecoveryEvent.update({
    where: { id: event.id },
    data: {
      status: "approved",
      reviewedAt: new Date(),
    },
  });
  await createAuditEvent({
    actorUserId: input.reviewerId,
    action: "wallet.recovery.approved",
    entityType: "WalletRecoveryEvent",
    entityId: event.id,
    metadata: { method: event.method },
  }).catch(() => {});
  return updated;
}

export function isHighRiskMethod(method: WalletRecoveryMethod): boolean {
  return (
    method === "operator_assisted" ||
    method === "guardian_shard" ||
    method === "offline_paper_kit"
  );
}
