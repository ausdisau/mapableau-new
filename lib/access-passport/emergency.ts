import type {
  EmergencyAccessRequest,
  EmergencyAccessScope,
} from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { asJson } from "@/lib/prisma-json";

/**
 * Emergency access.
 *
 * A first responder or emergency contact requests access via
 * `requestEmergencyAccess`. AI cannot approve. A human reviewer (typically
 * an operations admin or the participant themselves if awake) must approve
 * for the request to leave `reviewing` status.
 *
 * On approve, we auto-set an `expiresAt` so break-glass access does not
 * become ambient.
 */

export async function requestEmergencyAccess(input: {
  subjectId: string;
  requesterId: string;
  scope: EmergencyAccessScope;
  claimedContext: string;
  evidence?: Record<string, unknown>;
}): Promise<EmergencyAccessRequest> {
  const created = await prisma.emergencyAccessRequest.create({
    data: {
      subjectId: input.subjectId,
      requesterId: input.requesterId,
      scope: input.scope,
      status: "requested",
      claimedContext: input.claimedContext,
      evidence: asJson(input.evidence),
    },
  });
  await createAuditEvent({
    actorUserId: input.requesterId,
    action: "emergency_access.requested",
    entityType: "EmergencyAccessRequest",
    entityId: created.id,
    participantId: input.subjectId,
    metadata: { scope: input.scope },
  }).catch(() => {});
  return created;
}

export async function reviewEmergencyAccess(input: {
  requestId: string;
  reviewerId: string;
  decision: "approved" | "denied";
  ttlMinutes?: number;
  reason?: string;
}): Promise<EmergencyAccessRequest> {
  const existing = await prisma.emergencyAccessRequest.findUnique({
    where: { id: input.requestId },
  });
  if (!existing) throw new Error("request_not_found");
  if (existing.status !== "requested" && existing.status !== "reviewing") {
    throw new Error("request_not_reviewable");
  }
  const expiresAt =
    input.decision === "approved"
      ? new Date(Date.now() + (input.ttlMinutes ?? 60) * 60_000)
      : null;
  const updated = await prisma.emergencyAccessRequest.update({
    where: { id: existing.id },
    data: {
      status: input.decision,
      reviewerId: input.reviewerId,
      approvedAt: input.decision === "approved" ? new Date() : null,
      expiresAt: expiresAt,
    },
  });
  await createAuditEvent({
    actorUserId: input.reviewerId,
    action: `emergency_access.${input.decision}`,
    entityType: "EmergencyAccessRequest",
    entityId: existing.id,
    participantId: existing.subjectId,
    metadata: {
      reason: input.reason ?? null,
      ttlMinutes: input.ttlMinutes ?? 60,
    },
  }).catch(() => {});
  return updated;
}
