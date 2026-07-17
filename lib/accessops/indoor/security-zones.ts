import type { JsonObject } from "../types";

export function filterRestrictedZones(
  features: JsonObject[],
  restrictedZoneIds: string[],
): JsonObject[] {
  return features.filter(
    (feature) => !restrictedZoneIds.includes(String(feature.zoneId ?? "")),
  );
}
