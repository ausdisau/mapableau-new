import type { Prisma } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import type { adminCreatePeerEventSchema } from "@/lib/validation/peer";
import type { z } from "zod";

import { notifyPeerUser } from "./peer-notification-service";

export async function listPeerEvents() {
  return prisma.peerEvent.findMany({
    where: { status: "scheduled" },
    orderBy: { startsAt: "asc" },
    take: 50,
  });
}

export async function adminCreatePeerEvent(
  actorUserId: string,
  data: z.infer<typeof adminCreatePeerEventSchema>
) {
  const event = await prisma.peerEvent.create({
    data: {
      title: data.title,
      description: data.description,
      facilitatorName: data.facilitatorName,
      accessibilityOptions:
        (data.accessibilityOptions as Prisma.InputJsonValue) ?? {},
      capacity: data.capacity,
      startsAt: new Date(data.startsAt),
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
      locationType: data.locationType,
      meetingLinkPlaceholder: data.meetingLinkPlaceholder,
    },
  });

  await createAuditEvent({
    actorUserId,
    action: "peer.event.created",
    entityType: "PeerEvent",
    entityId: event.id,
  });

  return event;
}

export async function rsvpPeerEvent(peerProfileId: string, eventId: string, userId: string) {
  const rsvp = await prisma.peerEventRsvp.upsert({
    where: {
      eventId_peerProfileId: { eventId, peerProfileId },
    },
    create: { eventId, peerProfileId, status: "going" },
    update: { status: "going" },
  });

  await createAuditEvent({
    actorUserId: userId,
    action: "peer.event.rsvp",
    entityType: "PeerEventRsvp",
    entityId: rsvp.id,
  });

  return rsvp;
}

export async function sendEventReminders() {
  const soon = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const events = await prisma.peerEvent.findMany({
    where: {
      status: "scheduled",
      startsAt: { lte: soon, gte: new Date() },
    },
    include: { rsvps: { include: { peerProfile: true } } },
  });

  for (const event of events) {
    for (const rsvp of event.rsvps) {
      await notifyPeerUser(rsvp.peerProfile.userId, "event_reminder", {
        eventId: event.id,
      });
    }
  }
}
