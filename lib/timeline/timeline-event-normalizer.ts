import type { TimelineEventType } from "@prisma/client";

export function normalizeTimelinePayload(params: {
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
  return {
    participantId: params.participantId,
    eventType: params.eventType,
    title: params.title,
    summary: params.summary,
    sourceType: params.sourceType,
    sourceId: params.sourceId,
    occurredAt: params.occurredAt ?? new Date(),
    visibility: params.visibility ?? "participant",
    metadata: params.metadata,
  };
}
