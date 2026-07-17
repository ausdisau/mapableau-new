const MIN_COHORT_SIZE = 10;

export class InsufficientCohortError extends Error {
  constructor(reason: string) {
    super(`ANALYTICS_COHORT_TOO_SMALL:${reason}`);
    this.name = "InsufficientCohortError";
  }
}

/**
 * Reject aggregates over fewer than MIN_COHORT_SIZE participants to reduce
 * re-identification risk.
 */
export function assertCohortSize(count: number, label = "cohort"): void {
  if (!Number.isFinite(count) || count < MIN_COHORT_SIZE) {
    throw new InsufficientCohortError(`${label}:${count}<${MIN_COHORT_SIZE}`);
  }
}

export function safeAverage(sum: number, count: number): number {
  assertCohortSize(count);
  return sum / count;
}
