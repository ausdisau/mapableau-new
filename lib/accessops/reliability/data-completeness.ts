import type { MinuteStatusBucket } from "../types";

export function calculateDataCompleteness(
  buckets: MinuteStatusBucket[],
): number {
  const total = buckets.reduce(
    (sum, bucket) => sum + Math.max(0, bucket.minutes),
    0,
  );
  if (total === 0) return 0;
  const withEvidence = buckets
    .filter((bucket) => bucket.evidencePresent)
    .reduce((sum, bucket) => sum + Math.max(0, bucket.minutes), 0);
  return withEvidence / total;
}

export function countUnknownMinutes(buckets: MinuteStatusBucket[]): number {
  return buckets
    .filter((bucket) => bucket.state === "unknown" || bucket.state === "stale")
    .reduce((sum, bucket) => sum + Math.max(0, bucket.minutes), 0);
}
