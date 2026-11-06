import { coverageCareConfig } from "@/lib/config/coverage-care";

export function isCoverageCareSurfaceEnabled(): boolean {
  return coverageCareConfig.enabled;
}

export function coverageCareDisabledPayload() {
  return {
    error: "Coverage Care pilot is disabled",
    code: "COVERAGE_CARE_DISABLED",
    hint: "Set MAPABLE_COVERAGE_CARE_ENABLED=true in a non-production environment to explore the synthetic pilot.",
  } as const;
}
