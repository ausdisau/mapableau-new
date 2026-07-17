import { normalizeGtfsWheelchairBoarding } from "./gtfs-static";

export function stopWheelchairStatus(
  value?: string | number | null,
): ReturnType<typeof normalizeGtfsWheelchairBoarding> {
  return normalizeGtfsWheelchairBoarding(value);
}
