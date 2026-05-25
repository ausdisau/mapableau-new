import type { Prisma } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { createSupportTicket } from "@/lib/support/ticket-service";
import type { safetyEscalationSchema } from "@/lib/validation/peer";
import type { z } from "zod";

export const CRISIS_RESOURCES = [
  {
    name: "Lifeline",
    detail: "24/7 crisis support",
    url: "https://www.lifeline.org.au/",
    phone: "13 11 14",
  },
  {
    name: "Beyond Blue",
    detail: "Mental wellbeing support",
    url: "https://www.beyondblue.org.au/",
    phone: "1300 22 4636",
  },
  {
    name: "1800RESPECT",
    detail: "Violence and abuse counselling",
    url: "https://www.1800respect.org.au/",
    phone: "1800 737 732",
  },
  {
    name: "Emergency",
    detail: "If you are in immediate danger call emergency services",
    phone: "000",
  },
] as const;

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
