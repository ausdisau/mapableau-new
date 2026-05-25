import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { requireModuleEnabled } from "@/lib/feature-flags/require-module";
import { recordParticipantTimelineEvent } from "@/lib/timeline/timeline-service";
import { createWaitlistRequest } from "@/lib/capacity/waitlist-service";

export async function createUnmetNeed(params: {
  participantId: string;
  needType: string;
  description?: string;
  suburb?: string;
  postcode?: string;
  searchContext?: Record<string, unknown>;
  createdById?: string;
}) {
  await requireModuleEnabled("unmet_need_register_enabled");

  const regionKey = params.postcode ?? params.suburb ?? "unknown";

  const record = await prisma.unmetNeedRecord.create({
    data: {
      participantId: params.participantId,
      needType: params.needType as never,
      description: params.description,
      suburb: params.suburb,
      postcode: params.postcode,
      regionKey,
      createdById: params.createdById,
      status: "open",
      searchContexts: params.searchContext
        ? {
            create: { queryJson: params.searchContext as never },
          }
        : undefined,
    },
  });

  await prisma.unmetNeedEvent.create({
    data: {
      recordId: record.id,
      eventType: "created",
      actorUserId: params.createdById,
    },
  });

  await createAuditEvent({
    actorUserId: params.createdById,
    action: "unmet_need.created",
    entityType: "UnmetNeedRecord",
    entityId: record.id,
    participantId: params.participantId,
  });

  await recordParticipantTimelineEvent({
    participantId: params.participantId,
    eventType: "unmet_need_recorded",
    title: "Support gap recorded",
    summary: params.description ?? params.needType,
    sourceType: "UnmetNeedRecord",
    sourceId: record.id,
  });

  return record;
}

export async function convertUnmetNeedToWaitlist(
  recordId: string,
  actorUserId: string
) {
  const record = await prisma.unmetNeedRecord.findUnique({
    where: { id: recordId },
  });
  if (!record) throw new Error("NOT_FOUND");

  const waitlist = await createWaitlistRequest({
    participantId: record.participantId,
    requestedServiceType: record.needType,
    suburb: record.suburb ?? undefined,
    postcode: record.postcode ?? undefined,
    consentToNotifyProviders: true,
    createdById: actorUserId,
  });

  await prisma.unmetNeedRecord.update({
    where: { id: recordId },
    data: { status: "waitlist_created", waitlistId: waitlist.id },
  });

  return waitlist;
}
