import type {
  AgencyMetric,
  AgencyMetricSnapshot,
  EvalLabAssertion,
  EvalLabDimension,
  EvalLabScenarioResult,
  HardSafetyDimension,
  QualityMetricDimension,
} from "./types";
import {
  AGENCY_METRICS,
  HARD_SAFETY_DIMENSIONS,
  QUALITY_METRIC_DIMENSIONS,
} from "./types";

export function hardAssertion(
  id: string,
  dimension: HardSafetyDimension,
  pass: boolean,
  description: string,
  detail?: string,
): EvalLabAssertion {
  return { id, dimension, kind: "hard", pass, description, detail };
}

export function qualityAssertion(
  id: string,
  dimension: QualityMetricDimension,
  pass: boolean,
  description: string,
  detail?: string,
): EvalLabAssertion {
  return { id, dimension, kind: "quality", pass, description, detail };
}

export function emptyAgencySnapshot(): AgencyMetricSnapshot {
  return Object.fromEntries(
    AGENCY_METRICS.map((m) => [m, { pass: true, detail: "not_evaluated" }]),
  ) as AgencyMetricSnapshot;
}

export function setAgency(
  snapshot: AgencyMetricSnapshot,
  metric: AgencyMetric,
  pass: boolean,
  detail?: string,
): void {
  snapshot[metric] = { pass, detail };
}

export function scenarioHardPass(assertions: EvalLabAssertion[]): boolean {
  return assertions.filter((a) => a.kind === "hard").every((a) => a.pass);
}

export function qualityScore(assertions: EvalLabAssertion[]): number {
  const quality = assertions.filter((a) => a.kind === "quality");
  if (quality.length === 0) return 1;
  const passed = quality.filter((a) => a.pass).length;
  return passed / quality.length;
}

export function emptyHardBuckets(): Record<
  HardSafetyDimension,
  { passed: number; failed: number; total: number }
> {
  return Object.fromEntries(
    HARD_SAFETY_DIMENSIONS.map((d) => [d, { passed: 0, failed: 0, total: 0 }]),
  ) as Record<
    HardSafetyDimension,
    { passed: number; failed: number; total: number }
  >;
}

export function emptyQualityBuckets(): Record<
  QualityMetricDimension,
  { passed: number; failed: number; total: number }
> {
  return Object.fromEntries(
    QUALITY_METRIC_DIMENSIONS.map((d) => [
      d,
      { passed: 0, failed: 0, total: 0 },
    ]),
  ) as Record<
    QualityMetricDimension,
    { passed: number; failed: number; total: number }
  >;
}

export function accumulateAssertions(
  results: EvalLabScenarioResult[],
): {
  byHard: ReturnType<typeof emptyHardBuckets>;
  byQuality: ReturnType<typeof emptyQualityBuckets>;
  hardFailures: string[];
  qualityFailures: string[];
  agency: Record<AgencyMetric, { passed: number; failed: number }>;
} {
  const byHard = emptyHardBuckets();
  const byQuality = emptyQualityBuckets();
  const hardFailures: string[] = [];
  const qualityFailures: string[] = [];
  const agency = Object.fromEntries(
    AGENCY_METRICS.map((m) => [m, { passed: 0, failed: 0 }]),
  ) as Record<AgencyMetric, { passed: number; failed: number }>;

  for (const result of results) {
    for (const assertion of result.assertions) {
      if (assertion.kind === "hard") {
        const bucket = byHard[assertion.dimension as HardSafetyDimension];
        if (!bucket) continue;
        bucket.total += 1;
        if (assertion.pass) bucket.passed += 1;
        else {
          bucket.failed += 1;
          hardFailures.push(`${result.scenarioId}:${assertion.id}`);
        }
      } else {
        const bucket = byQuality[assertion.dimension as QualityMetricDimension];
        if (!bucket) continue;
        bucket.total += 1;
        if (assertion.pass) bucket.passed += 1;
        else {
          bucket.failed += 1;
          qualityFailures.push(`${result.scenarioId}:${assertion.id}`);
        }
      }
    }
    for (const metric of AGENCY_METRICS) {
      if (result.agency[metric].pass) agency[metric].passed += 1;
      else agency[metric].failed += 1;
    }
  }

  return { byHard, byQuality, hardFailures, qualityFailures, agency };
}

export function isHardDimension(dimension: EvalLabDimension): boolean {
  return (HARD_SAFETY_DIMENSIONS as readonly string[]).includes(dimension);
}
