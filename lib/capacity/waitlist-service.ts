import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { requireModuleEnabled } from "@/lib/feature-flags/require-module";
import { recordParticipantTimelineEvent } from "@/lib/timeline/timeline-service";

export async function createWaitlistRequest(params: {
  participantId: string;
  requestedServiceType: string;
  accessNeeds?: Record<string, unknown>;
  suburb?: string;
  postcode?: string;
  urgencyLevel?: "routine" | "soon" | "urgent";
  preferredDaysTimes?: Record<string, unknown>;
  consentToNotifyProviders?: boolean;
  createdById?: string;
}) {
  await requireModuleEnabled("waitlist_exchange_enabled");

  const record = await prisma.waitlistRequest.create({
    data: {
      participantId: params.participantId,
      requestedServiceType: params.requestedServiceType,
      accessNeeds: params.accessNeeds as never,
      suburb: params.suburb,
      postcode: params.postcode,
      urgencyLevel: params.urgencyLevel ?? "routine",
      preferredDaysTimes: params.preferredDaysTimes as never,
      consentToNotifyProviders: params.consentToNotifyProviders ?? false,
      createdById: params.createdById,
      status: "pending",
    },
  });

  await prisma.waitlistEvent.create({
    data: {
      waitlistId: record.id,
      eventType: "created",
      actorUserId: params.createdById,
    },
  });

  await createAuditEvent({
    actorUserId: params.createdById,
    action: "waitlist.created",
    entityType: "WaitlistRequest",
    entityId: record.id,
    participantId: params.participantId,
  });

  await recordParticipantTimelineEvent({
    participantId: params.participantId,
    eventType: "waitlist_created",
    title: "Added to waitlist",
    summary: `Waiting for ${params.requestedServiceType}`,
    sourceType: "WaitlistRequest",
    sourceId: record.id,
  });

  return record;
}

export async function listWaitlists(participantId?: string) {
  await requireModuleEnabled("waitlist_exchange_enabled");
  return prisma.waitlistRequest.findMany({
    where: participantId ? { participantId } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function updateWaitlistStatus(
  id: string,
  status: string,
  actorUserId: string
) {
  const updated = await prisma.waitlistRequest.update({
    where: { id },
    data: { status: status as never },
  });
  await prisma.waitlistEvent.create({
    data: { waitlistId: id, eventType: "status_changed", actorUserId },
  });
  return updated;
}
