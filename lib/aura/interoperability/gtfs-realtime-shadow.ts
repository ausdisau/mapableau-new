import { createHash } from "crypto";

import type { GtfsRealtimeTripUpdate } from "./gtfs-realtime";
import {
  applyRealtimeWheelchairOverride,
  deduplicateEntities,
  isStaleRealtime,
  validateRealtimeTimestamp,
} from "./gtfs-realtime";

export type GtfsRealtimeShadowEntity = GtfsRealtimeTripUpdate & {
  applied: boolean;
  rejectedReason?: string;
  vehicleAccessibilityDoesNotImplyStation: true;
};

const shadowFeed = new Map<string, GtfsRealtimeShadowEntity>();

export function resetGtfsRealtimeShadow(): void {
  shadowFeed.clear();
}

/**
 * Shadow ingestion — validates timestamps, rejects future/stale, never auto-writes bookings.
 */
export function ingestGtfsRealtimeShadow(input: {
  entities: GtfsRealtimeTripUpdate[];
  staleAfterMs?: number;
  now?: number;
}): {
  accepted: GtfsRealtimeShadowEntity[];
  rejected: GtfsRealtimeShadowEntity[];
} {
  const now = input.now ?? Date.now();
  const staleAfterMs = input.staleAfterMs ?? 5 * 60 * 1000;
  const accepted: GtfsRealtimeShadowEntity[] = [];
  const rejected: GtfsRealtimeShadowEntity[] = [];

  for (const entity of deduplicateEntities(input.entities)) {
    if (!validateRealtimeTimestamp(entity.feedTimestamp, now)) {
      rejected.push({
        ...entity,
        applied: false,
        rejectedReason: "future_or_invalid_feed_timestamp",
        vehicleAccessibilityDoesNotImplyStation: true,
      });
      continue;
    }
    if (!validateRealtimeTimestamp(entity.entityTimestamp, now)) {
      rejected.push({
        ...entity,
        applied: false,
        rejectedReason: "future_or_invalid_entity_timestamp",
        vehicleAccessibilityDoesNotImplyStation: true,
      });
      continue;
    }
    if (isStaleRealtime(entity.entityTimestamp, staleAfterMs, now)) {
      rejected.push({
        ...entity,
        applied: false,
        rejectedReason: "stale_realtime",
        vehicleAccessibilityDoesNotImplyStation: true,
      });
      continue;
    }

    const record: GtfsRealtimeShadowEntity = {
      ...entity,
      applied: true,
      vehicleAccessibilityDoesNotImplyStation: true,
    };
    shadowFeed.set(entity.entityId, record);
    accepted.push(record);
  }

  return { accepted, rejected };
}

export function resolveTripAccessibility(input: {
  staticValue: "unknown" | "accessible" | "not_accessible";
  entityId?: string;
}): "unknown" | "accessible" | "not_accessible" {
  if (!input.entityId) return input.staticValue;
  const entity = shadowFeed.get(input.entityId);
  if (!entity?.applied) return input.staticValue;
  return applyRealtimeWheelchairOverride(
    input.staticValue,
    entity.wheelchairAccessible,
  );
}

export function listShadowEntities(): GtfsRealtimeShadowEntity[] {
  return [...shadowFeed.values()];
}

export function shadowFeedHash(entities: GtfsRealtimeTripUpdate[]): string {
  return createHash("sha256").update(JSON.stringify(entities)).digest("hex");
}
