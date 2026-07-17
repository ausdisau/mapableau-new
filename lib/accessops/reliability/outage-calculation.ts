import type { MinuteStatusBucket } from "../types";

export interface OutageSummary {
  count: number;
  longestMinutes: number;
  totalMinutes: number;
}

export function calculateUnplannedOutages(
  buckets: MinuteStatusBucket[],
): OutageSummary {
  const durations: number[] = [];
  let active = 0;
  for (const bucket of buckets) {
    const isOutage =
      bucket.state === "temporarily_unavailable" ||
      bucket.state === "under_maintenance" ||
      bucket.state === "status_conflict";
    if (isOutage && !bucket.scheduled) {
      active += Math.max(0, bucket.minutes);
      continue;
    }
    if (active > 0) {
      durations.push(active);
      active = 0;
    }
  }
  if (active > 0) durations.push(active);
  return {
    count: durations.length,
    longestMinutes: durations.length > 0 ? Math.max(...durations) : 0,
    totalMinutes: durations.reduce((sum, value) => sum + value, 0),
  };
}
