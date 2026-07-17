import type { ConformanceResult } from "../types";

import { GTFS_REALTIME_PROFILE } from "./gtfs-realtime";
import { GTFS_SCHEDULE_PROFILE } from "./gtfs-static";

export function transitConformance(
  kind: "schedule" | "realtime",
  errors: string[] = [],
): ConformanceResult {
  return {
    conformant: errors.length === 0,
    profile:
      kind === "schedule" ? GTFS_SCHEDULE_PROFILE : GTFS_REALTIME_PROFILE,
    errors,
    warnings: [],
  };
}
