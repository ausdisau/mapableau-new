import type {
  DelegateAuthority,
  DelegateAuthorityVerification,
} from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

import { recordAuthorityTransaction } from "./transactions";

/**
 * Escalate the verification level on a `DelegateAuthority`.
 *
 * The escalation is one-way (self_asserted -> platform_verified ->
 * document_verified -> legal_instrument_verified). Downgrades happen via
 * revocation followed by a fresh authority.
 */
const RANK: Record<DelegateAuthorityVerification, number> = {
  self_asserted: 1,
  platform_verified: 2,
  document_verified: 3,
  legal_instrument_verified: 4,
};

export async function escalateVerification(
  authorityId: string,
  actorId: string,
  toLevel: DelegateAuthorityVerification,
  evidence?: Record<string, unknown>
): Promise<DelegateAuthority> {
  const authority = await prisma.delegateAuthority.findUnique({
    where: { id: authorityId },
  });
  if (!authority) throw new Error("authority_not_found");
  if (RANK[toLevel] <= RANK[authority.verification]) {
    throw new Error("verification_must_increase");
  }
  const updated = await prisma.delegateAuthority.update({
    where: { id: authorityId },
    data: { verification: toLevel },
  });
  await recordAuthorityTransaction({
    authorityId,
    actorId,
    transactionKind: "verification_escalated",
    fromStatus: authority.status,
    toStatus: authority.status,
    reason: `verification: ${authority.verification} -> ${toLevel}`,
    evidence,
  });
  await createAuditEvent({
    actorUserId: actorId,
    action: "delegate.verification.escalated",
    entityType: "DelegateAuthority",
    entityId: authorityId,
    participantId: authority.participantId,
    metadata: { from: authority.verification, to: toLevel },
  }).catch(() => {});
  return updated;
}
