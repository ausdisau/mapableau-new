import type { BundleSegmentType } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

const DEFAULT_BUFFERS: Record<BundleSegmentType, number> = {
  care_preparation: 30,
  transport_outbound: 20,
  care_at_destination: 0,
  transport_return: 20,
  care_post_arrival: 15,
};

export type BundleQuoteSegment = {
  segmentType: BundleSegmentType;
  sequenceOrder: number;
  scheduledStart?: string;
  scheduledEnd?: string;
  bufferMinutes: number;
};

export function buildDefaultSegments(
  journeyStart: Date
): BundleQuoteSegment[] {
  let cursor = journeyStart.getTime();
  const types: BundleSegmentType[] = [
    "care_preparation",
    "transport_outbound",
    "care_at_destination",
    "transport_return",
    "care_post_arrival",
  ];
  return types.map((segmentType, index) => {
    const bufferMinutes = DEFAULT_BUFFERS[segmentType];
    const start = new Date(cursor);
    const durationMs = (segmentType.includes("transport") ? 45 : 60) * 60_000;
    cursor = start.getTime() + durationMs + bufferMinutes * 60_000;
    return {
      segmentType,
      sequenceOrder: index,
      scheduledStart: start.toISOString(),
      scheduledEnd: new Date(start.getTime() + durationMs).toISOString(),
      bufferMinutes,
    };
  });
}

export function detectSegmentConflicts(segments: BundleQuoteSegment[]): string[] {
  const conflicts: string[] = [];
  for (let i = 1; i < segments.length; i++) {
    const prev = segments[i - 1];
    const curr = segments[i];
    if (prev.scheduledEnd && curr.scheduledStart) {
      const gap =
        new Date(curr.scheduledStart).getTime() -
        new Date(prev.scheduledEnd).getTime();
      const required = (prev.bufferMinutes + curr.bufferMinutes) * 60_000;
      if (gap < required) {
        conflicts.push(
          `Not enough time between ${prev.segmentType} and ${curr.segmentType}.`
        );
      }
    }
  }
  return conflicts;
}

export async function quoteBundle(input: {
  participantId: string;
  journeyStart: Date;
}) {
  const segments = buildDefaultSegments(input.journeyStart);
  const conflicts = detectSegmentConflicts(segments);
  return { segments, conflicts, requiresHumanConfirmation: true };
}

export async function createBundle(input: {
  participantId: string;
  createdById: string;
  title?: string;
  journeyStart: Date;
  actorRole?: string;
}) {
  const quote = await quoteBundle({
    participantId: input.participantId,
    journeyStart: input.journeyStart,
  });

  const bundle = await prisma.bookingBundle.create({
    data: {
      participantId: input.participantId,
      createdById: input.createdById,
      title: input.title ?? "Care and transport journey",
      status: quote.conflicts.length ? "draft" : "quoted",
      segments: {
        create: quote.segments.map((s) => ({
          segmentType: s.segmentType,
          sequenceOrder: s.sequenceOrder,
          scheduledStart: s.scheduledStart ? new Date(s.scheduledStart) : null,
          scheduledEnd: s.scheduledEnd ? new Date(s.scheduledEnd) : null,
          bufferMinutes: s.bufferMinutes,
        })),
      },
      events: {
        create: {
          eventType: "bundle.created",
          actorId: input.createdById,
          metadata: { conflicts: quote.conflicts },
        },
      },
    },
    include: { segments: true, events: true },
  });

  await createAuditEvent({
    actorUserId: input.createdById,
    actorRole: input.actorRole as never,
    action: "booking.created",
    entityType: "booking_bundle",
    entityId: bundle.id,
    participantId: input.participantId,
  });

  return { bundle, quote };
}
