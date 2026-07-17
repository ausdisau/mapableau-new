import type { AssuranceTestResult } from "@prisma/client";

export type OperatingEffectiveness = {
  effective: boolean;
  blocksReadiness: boolean;
  summary: string;
};

export function deriveOperatingEffectiveness(results: AssuranceTestResult[]): OperatingEffectiveness {
  if (results.length === 0) {
    return {
      effective: false,
      blocksReadiness: true,
      summary: "No control tests have been executed.",
    };
  }

  if (results.some((r) => r === "fail" || r === "blocked")) {
    return {
      effective: false,
      blocksReadiness: true,
      summary: "One or more control tests failed or are blocked.",
    };
  }

  if (results.every((r) => r === "not_run")) {
    return {
      effective: false,
      blocksReadiness: true,
      summary: "Control tests exist but none have been run.",
    };
  }

  if (results.some((r) => r === "partial" || r === "waived")) {
    return {
      effective: false,
      blocksReadiness: true,
      summary: "Partial or waived results do not demonstrate operating effectiveness.",
    };
  }

  if (results.every((r) => r === "pass")) {
    return {
      effective: true,
      blocksReadiness: false,
      summary: "All executed control tests passed.",
    };
  }

  return {
    effective: false,
    blocksReadiness: true,
    summary: "Mixed test results; readiness blocked until resolved.",
  };
}
