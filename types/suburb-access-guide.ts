/**
 * Suburb / locality Access Guide model aligned to ABS Suburbs and Localities (SAL).
 * Guides are advisory planning resources — not a guarantee of access.
 */

export type SuburbGuideStatus =
  | "not-started"
  | "draft"
  | "data-enriched"
  | "community-reported"
  | "partner-supplied"
  | "mapable-reviewed"
  | "mapable-verified"
  | "needs-local-verification";

export type SuburbAccessTheme =
  | "transport"
  | "toilets"
  | "parking-dropoff"
  | "step-free"
  | "sensory"
  | "venues"
  | "health-support"
  | "hazards";

export type SuburbGuideCentroid = {
  latitude: number;
  longitude: number;
};

export type SuburbGuideVenueHighlight = {
  id: string;
  name: string;
  summary: string;
  theme: SuburbAccessTheme;
  hrefSection: SuburbGuideMapSection;
};

export type SuburbGuideMapSection =
  | "toilets"
  | "transport"
  | "parking"
  | "quiet-spaces"
  | "accessible-venues"
  | "hazards";

export type SuburbGuideMappingMission = {
  id: string;
  title: string;
  detail: string;
};

export type SuburbGuideNearby = {
  salCode: string;
  name: string;
  state: string;
  slug: string;
  href: string;
};

export type SuburbGuideDataSource = {
  id: string;
  label: string;
  url?: string;
  note?: string;
};

export type SuburbAccessGuide = {
  salCode: string;
  name: string;
  state: string;
  /** Lowercase state slug used in URLs, e.g. act, nsw */
  stateSlug: string;
  lgaNames: string[];
  slug: string;
  centroid: SuburbGuideCentroid;
  boundaryGeojsonUrl: string | null;
  guideStatus: SuburbGuideStatus;
  accessSummary: string;
  confidenceScore: number;
  accessThemes: SuburbAccessTheme[];
  transportNotes: string[];
  toiletNotes: string[];
  parkingDropoffNotes: string[];
  stepFreeRouteNotes: string[];
  sensoryNotes: string[];
  venueHighlights: SuburbGuideVenueHighlight[];
  healthAndSupportAnchors: string[];
  localRisks: string[];
  nearbyGuides: SuburbGuideNearby[];
  /** Parent capital/regional Access Guide when available */
  parentCityGuideHref: string | null;
  parentCityGuideLabel: string | null;
  dataSources: SuburbGuideDataSource[];
  mappingMissions: SuburbGuideMappingMission[];
  lastUpdated: string;
  lastVerified: string | null;
  href: string;
  mapHref: string;
  reportHref: string;
};

export const SUBURB_GUIDE_DISCLAIMER =
  "MapAble guides provide practical access information to help people plan outings. They are not a guarantee of access and are not legal, medical, transport or NDIS advice. Conditions can change. Check opening hours, bookings, transport availability and venue accessibility before travelling.";
