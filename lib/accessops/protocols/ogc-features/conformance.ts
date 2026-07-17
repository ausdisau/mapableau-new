import type { ConformanceResult } from "../../types";

export const OGC_FEATURES_PUBLIC_PROFILE = "OGC API Features public read-only";

export function ogcFeaturesConformance(
  writeEnabled: boolean,
): ConformanceResult {
  const errors = writeEnabled ? ["write_operations_disabled"] : [];
  return {
    conformant: errors.length === 0,
    profile: OGC_FEATURES_PUBLIC_PROFILE,
    errors,
    warnings: [],
  };
}
