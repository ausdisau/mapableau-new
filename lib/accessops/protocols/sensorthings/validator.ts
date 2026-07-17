import type { ConformanceResult } from "../../types";

export const SENSORTHINGS_SENSING_PROFILE = "OGC SensorThings Sensing 1.1";

export function validateSensorThingsQuery(query: string): ConformanceResult {
  const lowered = query.toLowerCase();
  const errors: string[] = [];
  if (lowered.includes("tasking")) errors.push("tasking_profile_disabled");
  if (/[;$]|--|\/\*/.test(query)) errors.push("query_injection_pattern");
  return {
    conformant: errors.length === 0,
    profile: SENSORTHINGS_SENSING_PROFILE,
    errors,
    warnings: [],
  };
}
