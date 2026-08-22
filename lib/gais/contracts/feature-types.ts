export const GAIS_FEATURE_TYPES = [
  "PLACE",
  "ENTRANCE",
  "PATH",
  "CROSSING",
  "RAMP",
  "LIFT",
  "DOOR",
  "TOILET",
  "REST_POINT",
  "TRANSFER_POINT",
  "CHARGING_POINT",
  "TEMPORARY_BARRIER",
  "OTHER",
] as const;

export type GaisFeatureType = (typeof GAIS_FEATURE_TYPES)[number];

/** Categories rendered on the map layer (subset with distinct symbols). */
export const GAIS_MAP_LAYER_TYPES: GaisFeatureType[] = [
  "PLACE",
  "ENTRANCE",
  "LIFT",
  "RAMP",
  "CROSSING",
  "REST_POINT",
  "TEMPORARY_BARRIER",
];
