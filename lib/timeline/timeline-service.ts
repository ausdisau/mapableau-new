import type { TimelineEventType } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

import { normalizeTimelinePayload } from "./timeline-event-normalizer";
import { canViewParticipantTimeline, redactTimelineEvent } from "./timeline-access-policy";
import type { CurrentUser } from "@/lib/auth/current-user";

export async function recordParticipantTimelineEvent(params: {
  participantId: string;
  eventType: TimelineEventType;
  title: string;
  summary?: string;
  sourceType?: string;
  sourceId?: string;
  occurredAt?: Date;
  visibility?: string;
  metadata?: Record<string, unknown>;
}) {
  const payload = normalizeTimelinePayload(params);
  return prisma.participantTimelineEvent.create({
    data: {
      ...payload,
      metadata: payload.metadata as never,
    },
  });
}

export async function listParticipantTimeline(
  participantId: string,
  viewer: CurrentUser,
  filters?: { eventType?: TimelineEventType; from?: Date; to?: Date }
) {
  if (!canViewParticipantTimeline(viewer, participantId)) {
    throw new Error("TIMELINE_FORBIDDEN");
  }

  const events = await prisma.participantTimelineEvent.findMany({
    where: {
      participantId,
      ...(filters?.eventType ? { eventType: filters.eventType } : {}),
      ...(filters?.from || filters?.to
        ? {
            occurredAt: {
              ...(filters.from ? { gte: filters.from } : {}),
              ...(filters.to ? { lte: filters.to } : {}),
            },
          }
        : {}),
    },
    orderBy: { occurredAt: "desc" },
    take: 200,
  });

  const viewerIsParticipant = viewer.id === participantId;
  return events.map((e) => redactTimelineEvent(e, viewerIsParticipant));
}

export async function exportParticipantTimeline(params: {
  participantId: string;
  exportedById: string;
  format: string;
}) {
  const record = await prisma.timelineExport.create({
    data: {
      participantId: params.participantId,
      exportedById: params.exportedById,
      format: params.format,
    },
  });

  await createAuditEvent({
    actorUserId: params.exportedById,
    action: "timeline.exported",
    entityType: "TimelineExport",
    entityId: record.id,
    participantId: params.participantId,
    metadata: { format: params.format },
  });

  return record;
}
