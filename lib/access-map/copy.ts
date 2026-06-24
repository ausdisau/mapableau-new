export const ACCESS_DISCLAIMER =
  "MapAble Access provides community-reported and MapAble-verified accessibility information to help people make informed choices. Community reviews are not legal compliance assessments. MapAble Accreditation, where shown, reflects assessment against MapAble criteria and does not certify compliance with the Disability Discrimination Act or building standards.";

export const ACCESS_LABELS = {
  communityReviewed: "Community reviewed",
  userReported: "User reported",
  venueClaimed: "Venue claimed",
  mapableVerified: "MapAble verified",
  mapableAccreditedBronze: "MapAble Accredited: Bronze",
  mapableAccreditedSilver: "MapAble Accredited: Silver",
  mapableAccreditedGold: "MapAble Accredited: Gold",
  unknown: "Accessibility information unknown",
  needsMore: "Needs more access information",
  reportInaccurate: "Report inaccurate information",
} as const;

export const MAPABLE_MY_MAPS_KML_URL =
  "https://www.google.com/maps/d/kml?forcekml=1&mid=1sx0iyF2RqJKO8maeZ_Sn_EvWVyybcrOI";

export const ACCESS_IMPORT_ALLOWLIST_URLS = [MAPABLE_MY_MAPS_KML_URL] as const;

export const ACCESS_IMPORT_DATA_DIR = "data/imports";

export const ACCESS_LEGACY_GEOJSON_FILENAME = "accessible_locations_merged.geojson";

export const ACCESS_LEGACY_KML_FILENAME = "MapAble.kml";

export const ACCESS_LEGACY_KML_ALT_FILENAME =
  "MapAble by Australian Disability Ltd.kml";
