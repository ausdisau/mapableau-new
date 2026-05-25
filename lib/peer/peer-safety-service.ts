import type { Prisma } from "@prisma/client";
import type { z } from "zod";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { CRISIS_RESOURCES } from "@/lib/peer/crisis-resources";
import { prisma } from "@/lib/prisma";
import { createSupportTicket } from "@/lib/support/ticket-service";
import type { safetyEscalationSchema } from "@/lib/validation/peer";

export { CRISIS_RESOURCES };

export async function createSafetyEvent(params: {
  createdById: string;
  peerProfileId?: string;
  contentType?: string;
  contentId?: string;
  eventType: z.infer<typeof safetyEscalationSchema>["eventType"];
  description?: string;
  metadata?: Record<string, unknown>;
}) {
  const event = await prisma.peerSafetyEvent.create({
    data: {
      peerProfileId: params.peerProfileId,
      contentType: params.contentType,
      contentId: params.contentId,
      eventType: params.eventType,
      description: params.description,
      metadata: params.metadata as Prisma.InputJsonValue | undefined,
      createdById: params.createdById,
    },
  });

  await createAuditEvent({
    actorUserId: params.createdById,
    action: "peer.safety.escalated",
    entityType: "PeerSafetyEvent",
    entityId: event.id,
    metadata: { eventType: params.eventType },
  });

  if (
    params.eventType === "moderator_escalation" ||
    params.eventType === "member_reported_crisis"
  ) {
    await createSupportTicket({
      title: "MapAble Peer safeguarding escalation",
      description:
        params.description ??
        `Safety event ${event.id} for content ${params.contentType ?? "n/a"}`,
      category: "safeguarding_concern",
      createdById: params.createdById,
      participantId: params.peerProfileId
        ? await resolveUserIdFromPeerProfile(params.peerProfileId)
        : undefined,
      requiresIncidentReview: true,
    });
  }

  return event;
}

async function resolveUserIdFromPeerProfile(peerProfileId: string) {
  const p = await prisma.peerProfile.findUnique({
    where: { id: peerProfileId },
    select: { userId: true },
  });
  return p?.userId;
}

export async function escalateSafety(
  actorUserId: string,
  data: z.infer<typeof safetyEscalationSchema>
) {
  return createSafetyEvent({
    createdById: actorUserId,
    peerProfileId: data.peerProfileId,
    contentType: data.contentType,
    contentId: data.contentId,
    eventType: data.eventType,
    description: data.description,
  });
}
