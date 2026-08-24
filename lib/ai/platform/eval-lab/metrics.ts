import type {
  AgencyMetricSnapshot,
  EvalLabRunReport,
  EvalLabScenarioResult,
} from "./types";
import { AGENCY_METRICS } from "./types";

/**
 * Agency metrics describe system behaviour relative to participant authority.
 * They do not measure participant obedience or compliance.
 */
export function summariseAgency(
  results: EvalLabScenarioResult[],
): Record<
  (typeof AGENCY_METRICS)[number],
  { passed: number; failed: number; rate: number }
> {
  const out = Object.fromEntries(
    AGENCY_METRICS.map((m) => [m, { passed: 0, failed: 0, rate: 1 }]),
  ) as Record<
    (typeof AGENCY_METRICS)[number],
    { passed: number; failed: number; rate: number }
  >;

  for (const result of results) {
    for (const metric of AGENCY_METRICS) {
      if (result.agency[metric].pass) out[metric].passed += 1;
      else out[metric].failed += 1;
    }
  }

  for (const metric of AGENCY_METRICS) {
    const total = out[metric].passed + out[metric].failed;
    out[metric].rate = total === 0 ? 1 : out[metric].passed / total;
  }

  return out;
}

export function formatEvalLabReport(report: EvalLabRunReport): string {
  const lines: string[] = [
    "MapAble Nerve Centre Eval Lab Report",
    `Run: ${report.runId}`,
    `Started: ${report.startedAt}`,
    `Finished: ${report.finishedAt}`,
    `Production writes: ${report.productionWrites}`,
    `Real participant data: ${report.usedRealParticipantData}`,
    `Scenarios: ${report.results.length}`,
    `Hard invariant failures: ${report.hardInvariantFailures.length}`,
    `Quality metric failures (non-blocking): ${report.qualityFailures.length}`,
    "",
    "Hard safety dimensions:",
  ];

  for (const [dim, bucket] of Object.entries(report.byHardDimension)) {
    if (bucket.total === 0) continue;
    lines.push(
      `  - ${dim}: ${bucket.passed}/${bucket.total} passed` +
        (bucket.failed ? ` (${bucket.failed} FAILED)` : ""),
    );
  }

  lines.push("", "Agency metrics (system behaviour):");
  for (const [metric, bucket] of Object.entries(report.agencySummary)) {
    lines.push(
      `  - ${metric}: ${bucket.passed} pass / ${bucket.failed} fail`,
    );
  }

  if (report.hardInvariantFailures.length) {
    lines.push("", "Hard failures:");
    for (const f of report.hardInvariantFailures) lines.push(`  - ${f}`);
  }

  return lines.join("\n");
}

export function mergeAgencyDefaults(
  partial: Partial<AgencyMetricSnapshot>,
): AgencyMetricSnapshot {
  const base = Object.fromEntries(
    AGENCY_METRICS.map((m) => [m, { pass: true, detail: "default_pass" }]),
  ) as AgencyMetricSnapshot;
  return { ...base, ...partial };
}
