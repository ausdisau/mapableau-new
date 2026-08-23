const MAX_OBSERVATION_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;

export type TimestampValidationResult =
  | { ok: true; observedAt: Date }
  | { ok: false; error: string };

/**
 * Reject stale or far-future observation timestamps.
 */
export function validateObservationTimestamp(
  iso: string,
  now: Date = new Date(),
): TimestampValidationResult {
  const observedAt = new Date(iso);
  if (Number.isNaN(observedAt.getTime())) {
    return { ok: false, error: "observedAt must be a valid ISO-8601 timestamp" };
  }

  const delta = observedAt.getTime() - now.getTime();
  if (delta > MAX_FUTURE_SKEW_MS) {
    return { ok: false, error: "observedAt is too far in the future" };
  }
  if (now.getTime() - observedAt.getTime() > MAX_OBSERVATION_AGE_MS) {
    return { ok: false, error: "observedAt is older than the allowed ingest window" };
  }

  return { ok: true, observedAt };
}
