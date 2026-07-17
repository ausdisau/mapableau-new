export type GtfsRealtimeTripUpdate = {
  entityId: string;
  tripId: string;
  feedTimestamp: string;
  entityTimestamp: string;
  delaySeconds?: number;
  cancelled?: boolean;
  wheelchairAccessible?: boolean | null;
};

export function validateRealtimeTimestamp(ts: string, now = Date.now()): boolean {
  const parsed = Date.parse(ts);
  if (Number.isNaN(parsed)) return false;
  if (parsed > now + 5 * 60 * 1000) return false;
  return true;
}

export function applyRealtimeWheelchairOverride(
  staticValue: "unknown" | "accessible" | "not_accessible",
  realtime?: boolean | null,
): "unknown" | "accessible" | "not_accessible" {
  if (realtime === true) return "accessible";
  if (realtime === false) return "not_accessible";
  return staticValue;
}

export function isStaleRealtime(
  entityTimestamp: string,
  staleAfterMs: number,
  now = Date.now(),
): boolean {
  return Date.parse(entityTimestamp) + staleAfterMs < now;
}

export function deduplicateEntities<T extends { entityId: string }>(entities: T[]): T[] {
  const seen = new Set<string>();
  return entities.filter((e) => {
    if (seen.has(e.entityId)) return false;
    seen.add(e.entityId);
    return true;
  });
}
