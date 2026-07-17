export const GTFS_SCHEDULE_PROFILE = "GTFS Schedule";

export function normalizeGtfsWheelchairBoarding(
  value?: string | number | null,
): "accessible" | "not_accessible" | "unknown" {
  if (value === 1 || value === "1") return "accessible";
  if (value === 2 || value === "2") return "not_accessible";
  return "unknown";
}
