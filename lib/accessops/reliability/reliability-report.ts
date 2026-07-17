import type { ReliabilityWindowResult } from "../types";

export interface ReliabilityReport {
  summary: string;
  calculationVersion: string;
  warnings: string[];
}

export function buildReliabilityReport(
  result: ReliabilityWindowResult,
): ReliabilityReport {
  const warnings =
    result.unknownMinutes > 0
      ? ["unknown_minutes_not_counted_as_available"]
      : [];
  return {
    summary: `${result.verifiedAvailableMinutes}/${result.expectedAvailableMinutes} expected minutes verified available`,
    calculationVersion: result.calculationVersion,
    warnings,
  };
}
