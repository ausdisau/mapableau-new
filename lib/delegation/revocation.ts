import type { DelegateAuthority } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

import { recordAuthorityTransaction } from "./transactions";

export async function revokeDelegateAuthority(
  authorityId: string,
  actorId: string,
  reason?: string
): Promise<DelegateAuthority> {
  const authority = await prisma.delegateAuthority.findUnique({
    where: { id: authorityId },
  });
  if (!authority) throw new Error("authority_not_found");
  const updated = await prisma.delegateAuthority.update({
    where: { id: authorityId },
    data: { status: "revoked" },
  });
  await recordAuthorityTransaction({
    authorityId,
    actorId,
    transactionKind: "revoked",
    fromStatus: authority.status,
    toStatus: "revoked",
    reason,
  });
  await createAuditEvent({
    actorUserId: actorId,
    action: "delegate.authority.revoked",
    entityType: "DelegateAuthority",
    entityId: authorityId,
    participantId: authority.participantId,
    metadata: { reason: reason ?? null },
  }).catch(() => {});
  return updated;
}
