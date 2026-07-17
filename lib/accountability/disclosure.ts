import {
  accountabilityConfig,
  DEFAULT_PUBLIC_COHORT_THRESHOLD,
  SUPPRESSED_DATA_NOTICE,
} from "@/lib/config/accountability";

export type DisclosureResult = {
  suppressed: boolean;
  value: number | null;
  roundedValue: number | null;
  notice: string | null;
  threshold: number;
};

/**
 * Privacy-safe disclosure for public accountability metrics.
 * Never presents zero when data was suppressed for small cohorts.
 */
export function applyCohortSuppression(
  sampleSize: number | null | undefined,
  value: number | null | undefined,
  options?: {
    minimumCohortSize?: number;
    roundToNearest?: number | null;
  }
): DisclosureResult {
  const threshold =
    options?.minimumCohortSize ??
    accountabilityConfig.defaultCohortThreshold ??
    DEFAULT_PUBLIC_COHORT_THRESHOLD;

  if (
    sampleSize != null &&
    sampleSize > 0 &&
    sampleSize < threshold &&
    value != null
  ) {
    return {
      suppressed: true,
      value: null,
      roundedValue: null,
      notice: SUPPRESSED_DATA_NOTICE,
      threshold,
    };
  }

  let roundedValue = value ?? null;
  const roundTo = options?.roundToNearest;
  if (roundedValue != null && roundTo != null && roundTo > 1) {
    roundedValue = Math.round(roundedValue / roundTo) * roundTo;
  }

  return {
    suppressed: false,
    value: value ?? null,
    roundedValue,
    notice: null,
    threshold,
  };
}

export function describeTrend(
  current: number | null,
  previous: number | null
): string {
  if (current == null || previous == null) {
    return "Trend not available for this reporting period.";
  }
  if (current === previous) {
    return "No change compared with the previous reporting period.";
  }
  const direction = current > previous ? "increased" : "decreased";
  const delta = Math.abs(current - previous);
  return `Value ${direction} by ${formatDelta(delta)} compared with the previous reporting period.`;
}

function formatDelta(delta: number): string {
  if (Number.isInteger(delta)) return String(delta);
  return delta.toFixed(1);
}
