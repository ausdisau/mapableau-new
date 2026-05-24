import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { remainingSystemsConfig } from "@/lib/config/remaining-systems";
import { prisma } from "@/lib/prisma";

export async function createDeletionRequest(userId: string, reason?: string) {
  if (!remainingSystemsConfig.privacyGovernanceEnabled) {
    throw new Error("PRIVACY_GOVERNANCE_DISABLED");
  }

  const hold = await prisma.legalHoldRecord.findFirst({
    where: {
      entityType: "User",
      entityId: userId,
      active: true,
    },
  });
  if (hold) {
    const request = await prisma.dataDeletionRequest.create({
      data: {
        userId,
        reason,
        status: "blocked_legal_hold",
      },
    });
    await prisma.dataDeletionEvent.create({
      data: {
        requestId: request.id,
        action: "blocked_legal_hold",
        notes: hold.reason,
      },
    });
    return { request, blocked: true };
  }

  const request = await prisma.dataDeletionRequest.create({
    data: { userId, reason, status: "pending" },
  });

  await prisma.dataDeletionEvent.create({
    data: { requestId: request.id, action: "created", actorId: userId },
  });

  await createAuditEvent({
    actorUserId: userId,
    action: "privacy.deletion_requested",
    entityType: "DataDeletionRequest",
    entityId: request.id,
  });

  return { request, blocked: false };
}

export async function reviewDeletionRequest(
  requestId: string,
  actorId: string,
  approve: boolean
) {
  const status = approve ? "under_review" : "rejected";
  const request = await prisma.dataDeletionRequest.update({
    where: { id: requestId },
    data: { status, reviewedBy: actorId },
  });

  await prisma.dataDeletionEvent.create({
    data: {
      requestId,
      action: approve ? "admin_review_started" : "rejected",
      actorId,
    },
  });

  await createAuditEvent({
    actorUserId: actorId,
    action: "privacy.deletion_reviewed",
    entityType: "DataDeletionRequest",
    entityId: requestId,
    metadata: { approve },
  });

  return request;
}
