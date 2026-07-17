import type { ConformanceResult } from "../../types";

import { SENSORTHINGS_SENSING_PROFILE } from "./validator";

export function sensorThingsConformance(
  hasTasking: boolean,
): ConformanceResult {
  const errors = hasTasking ? ["tasking_not_allowed"] : [];
  return {
    conformant: errors.length === 0,
    profile: SENSORTHINGS_SENSING_PROFILE,
    errors,
    warnings: [],
  };
}
