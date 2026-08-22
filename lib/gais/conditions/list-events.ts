import { prisma } from "@/lib/prisma";

import { mapChangeReviewToAccessCondition } from "./map-change-review";
import { mapTemporaryBarrierToAccessCondition } from "./map-barrier";
import { buildActiveAtPrismaFilter, isEventActiveAt, parseActiveAt } from "./temporal";
import type { GaisAccessConditionEvent, ListAccessConditionsInput } from "./types";

const DEFAULT_LIMIT = 100;

function stripPrivateFields(event: GaisAccessConditionEvent): GaisAccessConditionEvent {
  return event;
}

async function loadBarrierConditions(
  input: ListAccessConditionsInput,
  activeAt: Date,
): Promise<GaisAccessConditionEvent[]> {
  const limit = input.limit ?? input.bounds?.limit ?? DEFAULT_LIMIT;

  const where: Record<string, unknown> = {
    ...buildActiveAtPrismaFilter(activeAt),
  };

  if (input.graphId) {
    where.graphId = input.graphId;
  }

  if (input.bounds) {
    where.latitude = { gte: input.bounds.minLat, lte: input.bounds.maxLat };
    where.longitude = { gte: input.bounds.minLng, lte: input.bounds.maxLng };
  }

  const barriers = await prisma.accessTemporaryBarrier.findMany({
    where,
    take: limit,
    orderBy: { reportedAt: "desc" },
  });

  return barriers
    .map(mapTemporaryBarrierToAccessCondition)
    .filter((e): e is GaisAccessConditionEvent => e != null)
    .filter((e) => isEventActiveAt(e, activeAt))
    .map(stripPrivateFields);
}

async function loadChangeReviewConditions(
  input: ListAccessConditionsInput,
  activeAt: Date,
  remaining: number,
): Promise<GaisAccessConditionEvent[]> {
  if (remaining <= 0) return [];

  const reviews = await prisma.accessChangeReviewRecord.findMany({
    where: {
      decision: "accepted_as_temporary",
      createdAt: { lte: activeAt },
      OR: [{ expiryAt: null }, { expiryAt: { gt: activeAt } }],
      ...(input.placeId ? { placeId: input.placeId } : {}),
    },
    include: {
      place: { include: { location: true } },
    },
    take: remaining,
    orderBy: { createdAt: "desc" },
  });

  return reviews
    .map(mapChangeReviewToAccessCondition)
    .filter((e): e is GaisAccessConditionEvent => e != null)
    .filter((e) => {
      if (input.bounds && e.geometry?.type === "Point") {
        const [lng, lat] = e.geometry.coordinates;
        return (
          lat >= input.bounds.minLat &&
          lat <= input.bounds.maxLat &&
          lng >= input.bounds.minLng &&
          lng <= input.bounds.maxLng
        );
      }
      if (input.placeId) return e.placeId === input.placeId;
      return !input.bounds;
    })
    .filter((e) => isEventActiveAt(e, activeAt))
    .map(stripPrivateFields);
}

/**
 * List factual, time-aware Access Conditions (GAIS Temporal Accessibility Events).
 * No forecasting — active window only.
 */
export async function listAccessConditions(
  input: ListAccessConditionsInput = {},
): Promise<GaisAccessConditionEvent[]> {
  const activeAt = parseActiveAt(input.activeAt);
  const limit = input.limit ?? input.bounds?.limit ?? DEFAULT_LIMIT;

  let events = await loadBarrierConditions(input, activeAt);

  if (input.placeId) {
    events = events.filter((e) => !e.placeId || e.placeId === input.placeId);
  }

  const remaining = Math.max(0, limit - events.length);
  const reviewEvents = await loadChangeReviewConditions(input, activeAt, remaining);

  const merged = [...events, ...reviewEvents];
  return merged
    .filter((e) => isEventActiveAt(e, activeAt))
    .sort((a, b) => b.reportedAt.localeCompare(a.reportedAt))
    .slice(0, limit);
}

/** @deprecated Alias — use listAccessConditions */
export async function listActiveAccessibilityEvents(
  bounds?: ListAccessConditionsInput["bounds"],
  activeAt?: Date,
): Promise<GaisAccessConditionEvent[]> {
  return listAccessConditions({ bounds, activeAt });
}

export async function listAccessConditionsForPlace(
  placeId: string,
  activeAt?: Date,
): Promise<GaisAccessConditionEvent[]> {
  return listAccessConditions({ placeId, activeAt });
}

export async function listAccessConditionsForGraph(
  graphId: string,
  activeAt?: Date,
): Promise<GaisAccessConditionEvent[]> {
  return listAccessConditions({ graphId, activeAt });
}
