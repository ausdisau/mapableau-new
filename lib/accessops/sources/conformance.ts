import type { ConformanceResult } from "../types";

export function evaluateSourceConformance(
  profile: string,
  errors: string[] = [],
): ConformanceResult {
  return { conformant: errors.length === 0, profile, errors, warnings: [] };
}
