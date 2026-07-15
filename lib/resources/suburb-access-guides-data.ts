import type {
  SuburbAccessGuide,
  SuburbAccessTheme,
  SuburbGuideMapSection,
  SuburbGuideStatus,
  SuburbGuideVenueHighlight,
} from "@/types/suburb-access-guide";
import { SUBURB_GUIDE_DISCLAIMER } from "@/types/suburb-access-guide";

export { SUBURB_GUIDE_DISCLAIMER };

type SuburbGuideSeed = {
  salCode: string;
  name: string;
  state: string;
  stateSlug: string;
  lgaNames: string[];
  slug: string;
  latitude: number;
  longitude: number;
  guideStatus: SuburbGuideStatus;
  accessSummary: string;
  confidenceScore: number;
  accessThemes: SuburbAccessTheme[];
  transportNotes: string[];
  toiletNotes: string[];
  parkingDropoffNotes: string[];
  stepFreeRouteNotes: string[];
  sensoryNotes: string[];
  venueHighlights: Array<{
    id: string;
    name: string;
    summary: string;
    theme: SuburbAccessTheme;
    hrefSection: SuburbGuideMapSection;
  }>;
  healthAndSupportAnchors: string[];
  localRisks: string[];
  nearby: Array<{
    salCode: string;
    name: string;
    state: string;
    stateSlug: string;
    slug: string;
  }>;
  parentCityGuideHref: string | null;
  parentCityGuideLabel: string | null;
  mappingMissions: Array<{ id: string; title: string; detail: string }>;
  lastUpdated: string;
  lastVerified: string | null;
};

function suburbHrefs(stateSlug: string, slug: string) {
  const base = `/guides/suburbs/${stateSlug}/${slug}`;
  return {
    href: base,
    mapHref: `${base}/map`,
    reportHref: `${base}/report-update`,
  };
}

function buildGuide(seed: SuburbGuideSeed): SuburbAccessGuide {
  const hrefs = suburbHrefs(seed.stateSlug, seed.slug);
  return {
    salCode: seed.salCode,
    name: seed.name,
    state: seed.state,
    stateSlug: seed.stateSlug,
    lgaNames: seed.lgaNames,
    slug: seed.slug,
    centroid: {
      latitude: seed.latitude,
      longitude: seed.longitude,
    },
    boundaryGeojsonUrl: null,
    guideStatus: seed.guideStatus,
    accessSummary: seed.accessSummary,
    confidenceScore: seed.confidenceScore,
    accessThemes: seed.accessThemes,
    transportNotes: seed.transportNotes,
    toiletNotes: seed.toiletNotes,
    parkingDropoffNotes: seed.parkingDropoffNotes,
    stepFreeRouteNotes: seed.stepFreeRouteNotes,
    sensoryNotes: seed.sensoryNotes,
    venueHighlights: seed.venueHighlights satisfies SuburbGuideVenueHighlight[],
    healthAndSupportAnchors: seed.healthAndSupportAnchors,
    localRisks: seed.localRisks,
    nearbyGuides: seed.nearby.map((n) => ({
      salCode: n.salCode,
      name: n.name,
      state: n.state,
      slug: n.slug,
      href: suburbHrefs(n.stateSlug, n.slug).href,
    })),
    parentCityGuideHref: seed.parentCityGuideHref,
    parentCityGuideLabel: seed.parentCityGuideLabel,
    dataSources: [
      {
        id: "abs-sal",
        label: "ABS Suburbs and Localities (SAL)",
        note: "Canonical suburb/locality geography for MapAble suburb guides.",
      },
      {
        id: "mapable-community",
        label: "MapAble access notes",
        note: "Community and partner planning notes; always re-check on the day.",
      },
    ],
    mappingMissions: seed.mappingMissions,
    lastUpdated: seed.lastUpdated,
    lastVerified: seed.lastVerified,
    ...hrefs,
  };
}

/**
 * Seed catalogue for the national suburb guide system.
 * Additional SAL localities can be imported into this array without new page templates.
 */
const suburbGuideSeeds: SuburbGuideSeed[] = [
  {
    salCode: "SAL80026",
    name: "Acton",
    state: "ACT",
    stateSlug: "act",
    lgaNames: ["Unincorporated ACT"],
    slug: "acton",
    latitude: -35.2820,
    longitude: 149.1185,
    guideStatus: "mapable-reviewed",
    accessSummary:
      "A compact lakeside and civic locality near the National Museum precinct. Useful for short, predictable outings when you plan toilets, rest spots and light-rail transfer early.",
    confidenceScore: 72,
    accessThemes: ["transport", "toilets", "sensory", "venues", "parking-dropoff"],
    transportNotes: [
      "Light rail and bus links serve the surrounding civic corridor — confirm step-free access at your stop.",
      "Walking distances to lakeside paths can feel longer than expected; build in rest time.",
    ],
    toiletNotes: [
      "Accessible toilets are available at major nearby cultural venues — confirm Changing Places needs before you go.",
    ],
    parkingDropoffNotes: [
      "Accessible parking near museum and lakeside entries may be weather-exposed.",
      "Drop-off close to venue entrances can reduce fatigue before a visit starts.",
    ],
    stepFreeRouteNotes: [
      "Prefer sealed foreshore and venue paths; verify current path works and temporary closures.",
    ],
    sensoryNotes: [
      "Open spaces can be bright and windy; headphone and shade options help.",
      "Museum quiet hours (when available) can lower gallery load — book ahead if offered.",
    ],
    venueHighlights: [
      {
        id: "nma",
        name: "National Museum of Australia",
        summary: "Indoor culture stop with lifts, toilets and quiet-room options.",
        theme: "venues",
        hrefSection: "accessible-venues",
      },
    ],
    healthAndSupportAnchors: [
      "Plan hospital or clinic transfers separately if combining civic visits with appointments.",
    ],
    localRisks: [
      "Crowds increase on event days around the lake and civic precinct.",
      "Weather-exposed outdoor links between parking and venues.",
    ],
    nearby: [
      {
        salCode: "SAL80145",
        name: "Braddon",
        state: "ACT",
        stateSlug: "act",
        slug: "braddon",
      },
      {
        salCode: "SAL80120",
        name: "City",
        state: "ACT",
        stateSlug: "act",
        slug: "city",
      },
    ],
    parentCityGuideHref: "/guides/act/canberra-accessibility-guide",
    parentCityGuideLabel: "Canberra Accessibility Guide",
    mappingMissions: [
      {
        id: "acton-changing-places",
        title: "Confirm Changing Places availability nearby",
        detail: "Verify opening hours and location notes for adult change facilities.",
      },
    ],
    lastUpdated: "2026-07-15",
    lastVerified: "2026-07-10",
  },
  {
    salCode: "SAL80145",
    name: "Braddon",
    state: "ACT",
    stateSlug: "act",
    lgaNames: ["Unincorporated ACT"],
    slug: "braddon",
    latitude: -35.2705,
    longitude: 149.1340,
    guideStatus: "data-enriched",
    accessSummary:
      "Mixed residential and hospitality strip north of the city. Good for short food-and-footpath missions when gradients and crowded evenings are planned for.",
    confidenceScore: 58,
    accessThemes: ["step-free", "venues", "parking-dropoff", "sensory"],
    transportNotes: [
      "Bus and light-rail connected; confirm kerb ramps at your boarding stop.",
    ],
    toiletNotes: [
      "Public toilets may be limited on retail stretches — check venue toilets and hours.",
    ],
    parkingDropoffNotes: [
      "Street parking fills quickly; accessible bays need local confirmation.",
    ],
    stepFreeRouteNotes: [
      "Footpaths vary; survey the block you need rather than assuming continuous step-free retail frontage.",
    ],
    sensoryNotes: [
      "Evening hospitality noise can rise quickly; choose earlier visits if sound is a concern.",
    ],
    venueHighlights: [],
    healthAndSupportAnchors: [],
    localRisks: ["Crowded weekend evenings", "Uneven terrace entries at some venues"],
    nearby: [
      {
        salCode: "SAL80026",
        name: "Acton",
        state: "ACT",
        stateSlug: "act",
        slug: "acton",
      },
      {
        salCode: "SAL80120",
        name: "City",
        state: "ACT",
        stateSlug: "act",
        slug: "city",
      },
    ],
    parentCityGuideHref: "/guides/act/canberra-accessibility-guide",
    parentCityGuideLabel: "Canberra Accessibility Guide",
    mappingMissions: [
      {
        id: "braddon-toilets",
        title: "Map closest accessible toilets",
        detail: "Verify hours, adult-change needs and step-free entry.",
      },
      {
        id: "braddon-quiet",
        title: "List quieter daytime outdoor seats",
        detail: "Note shade and distance from busy laneways.",
      },
    ],
    lastUpdated: "2026-07-12",
    lastVerified: null,
  },
  {
    salCode: "SAL80120",
    name: "City",
    state: "ACT",
    stateSlug: "act",
    lgaNames: ["Unincorporated ACT"],
    slug: "city",
    latitude: -35.2801,
    longitude: 149.1310,
    guideStatus: "draft",
    accessSummary:
      "Canberra’s civic and retail core. Treat this as a draft suburb sheet — useful for planning prompts, not a complete access audit.",
    confidenceScore: 34,
    accessThemes: ["transport", "toilets", "venues"],
    transportNotes: [
      "Light rail terminus and bus interchanges concentrate here — verify lift and ramp status on the day.",
    ],
    toiletNotes: ["Confirm shopping-centre and station toilet access before longer stays."],
    parkingDropoffNotes: ["Accessible parking rules change with events and roadworks."],
    stepFreeRouteNotes: ["Prefer main plaza routes until laneway audits are complete."],
    sensoryNotes: ["Event days raise crowd and noise load quickly."],
    venueHighlights: [],
    healthAndSupportAnchors: [],
    localRisks: ["Event-day road closures", "Busy pedestrian peaks at lunch"],
    nearby: [
      {
        salCode: "SAL80026",
        name: "Acton",
        state: "ACT",
        stateSlug: "act",
        slug: "acton",
      },
      {
        salCode: "SAL80145",
        name: "Braddon",
        state: "ACT",
        stateSlug: "act",
        slug: "braddon",
      },
    ],
    parentCityGuideHref: "/guides/act/canberra-accessibility-guide",
    parentCityGuideLabel: "Canberra Accessibility Guide",
    mappingMissions: [
      {
        id: "city-lifts",
        title: "Verify station and centre lifts",
        detail: "Record out-of-service patterns and alternate step-free exits.",
      },
      {
        id: "city-quiet",
        title: "Identify quiet rest spots",
        detail: "Indoor and outdoor options within a short wheelchair roll.",
      },
    ],
    lastUpdated: "2026-07-08",
    lastVerified: null,
  },
  {
    salCode: "SAL10912",
    name: "Pyrmont",
    state: "NSW",
    stateSlug: "nsw",
    lgaNames: ["City of Sydney"],
    slug: "pyrmont",
    latitude: -33.8690,
    longitude: 151.1950,
    guideStatus: "partner-supplied",
    accessSummary:
      "Harbour-edge suburb with light rail, steep pockets and event crowds. Partner notes help with ferry and light-rail planning — still confirm steps and lift status on the day.",
    confidenceScore: 66,
    accessThemes: ["transport", "step-free", "venues", "hazards"],
    transportNotes: [
      "Light rail and ferry-adjacent links; verify lift outages before relying on a single stop.",
    ],
    toiletNotes: ["Public waterfront toilets need hours confirmation."],
    parkingDropoffNotes: ["Limited accessible street parking; use venue or car-park access notes."],
    stepFreeRouteNotes: [
      "Some harbour promenade segments are strong; hillside streets are not.",
    ],
    sensoryNotes: ["Cruise and event days increase noise and queues."],
    venueHighlights: [
      {
        id: "darling-harbour-edge",
        name: "Darling Harbour edge promenades",
        summary: "Often usable sealed paths when lifts and bridges are operating.",
        theme: "step-free",
        hrefSection: "accessible-venues",
      },
    ],
    healthAndSupportAnchors: [],
    localRisks: ["Steep cross streets", "Bridge and lift outages"],
    nearby: [
      {
        salCode: "SAL11588",
        name: "Ultimo",
        state: "NSW",
        stateSlug: "nsw",
        slug: "ultimo",
      },
    ],
    parentCityGuideHref: "/guides/nsw/sydney-accessibility-guide",
    parentCityGuideLabel: "Sydney Accessibility Guide",
    mappingMissions: [
      {
        id: "pyrmont-lifts",
        title: "Audit light-rail lift reliability notes",
        detail: "Capture known outage patterns and step-free alternatives.",
      },
    ],
    lastUpdated: "2026-07-14",
    lastVerified: null,
  },
  {
    salCode: "SAL11588",
    name: "Ultimo",
    state: "NSW",
    stateSlug: "nsw",
    lgaNames: ["City of Sydney"],
    slug: "ultimo",
    latitude: -33.8790,
    longitude: 151.2000,
    guideStatus: "community-reported",
    accessSummary:
      "Education and museum-adjacent suburb with mixed footpath quality. Community reports help flag quiet corners and steep blocks — treat as unfinished.",
    confidenceScore: 41,
    accessThemes: ["venues", "sensory", "step-free"],
    transportNotes: ["Light rail edge and bus links; confirm stop access."],
    toiletNotes: ["Rely on venue toilets until public toilet audits are complete."],
    parkingDropoffNotes: ["Limited accessible bays — use booked drop-off where possible."],
    stepFreeRouteNotes: ["Prefer Broadway corridor; side streets vary."],
    sensoryNotes: ["Campus peaks create sudden crowd surges."],
    venueHighlights: [],
    healthAndSupportAnchors: [],
    localRisks: ["Steep cross-grades", "Construction detours"],
    nearby: [
      {
        salCode: "SAL10912",
        name: "Pyrmont",
        state: "NSW",
        stateSlug: "nsw",
        slug: "pyrmont",
      },
    ],
    parentCityGuideHref: "/guides/nsw/sydney-accessibility-guide",
    parentCityGuideLabel: "Sydney Accessibility Guide",
    mappingMissions: [
      {
        id: "ultimo-quiet",
        title: "Map quieter outdoor seats",
        detail: "Away from Broadway peaks where possible.",
      },
    ],
    lastUpdated: "2026-07-11",
    lastVerified: null,
  },
  {
    salCode: "SAL21104",
    name: "Carlton",
    state: "VIC",
    stateSlug: "vic",
    lgaNames: ["Melbourne", "Yarra"],
    slug: "carlton",
    latitude: -37.8001,
    longitude: 144.9670,
    guideStatus: "needs-local-verification",
    accessSummary:
      "University and museum precinct suburb. Draft notes exist for tram corridors and parks, but gradients, laneway dining and toilet details still need local verification.",
    confidenceScore: 38,
    accessThemes: ["transport", "venues", "toilets", "sensory"],
    transportNotes: ["Tram spine along Swanston/Lygon corridors — confirm level-access stops."],
    toiletNotes: ["Museum and park toilets need fresh hours and adult-change checks."],
    parkingDropoffNotes: ["Permit and ticketed parking mix; verify accessible bays locally."],
    stepFreeRouteNotes: ["Main avenues are stronger than bluestone laneways."],
    sensoryNotes: ["Festival and student peaks change noise suddenly."],
    venueHighlights: [],
    healthAndSupportAnchors: [],
    localRisks: ["Bluestone laneways", "Crowd peaks"],
    nearby: [],
    parentCityGuideHref: "/guides/vic/melbourne-accessibility-guide",
    parentCityGuideLabel: "Melbourne Accessibility Guide",
    mappingMissions: [
      {
        id: "carlton-trams",
        title: "Verify level-access tram stops",
        detail: "List usable stops for museum and park day trips.",
      },
      {
        id: "carlton-toilets",
        title: "Confirm accessible public toilets",
        detail: "Hours, adult change and step-free entry.",
      },
    ],
    lastUpdated: "2026-07-09",
    lastVerified: null,
  },
  {
    salCode: "SAL31022",
    name: "South Brisbane",
    state: "QLD",
    stateSlug: "qld",
    lgaNames: ["Brisbane"],
    slug: "south-brisbane",
    latitude: -27.4760,
    longitude: 153.0180,
    guideStatus: "mapable-verified",
    accessSummary:
      "Cultural and riverside suburb around South Bank. MapAble-reviewed notes for shade, toilets and ferry/bus links — still re-check heat, events and lift status before travelling.",
    confidenceScore: 81,
    accessThemes: [
      "transport",
      "toilets",
      "step-free",
      "sensory",
      "venues",
      "parking-dropoff",
    ],
    transportNotes: [
      "Train, bus and CityCat-adjacent options — confirm step-free interchange details.",
    ],
    toiletNotes: [
      "South Bank public toilets and venue toilets are usually strong options; confirm Changing Places needs.",
    ],
    parkingDropoffNotes: [
      "Use accessible parking near cultural venues; boardwalk walks can be long in heat.",
    ],
    stepFreeRouteNotes: [
      "Riverside promenades are generally sealed; temporary event fences change routes.",
    ],
    sensoryNotes: [
      "Heat, glare and weekend crowds are the main sensory loads — morning visits help.",
    ],
    venueHighlights: [
      {
        id: "south-bank-parklands",
        name: "South Bank Parklands",
        summary: "Shade, toilets and resting points when event layouts allow.",
        theme: "venues",
        hrefSection: "accessible-venues",
      },
    ],
    healthAndSupportAnchors: [
      "Keep water and shade plans for heat-sensitive travellers.",
    ],
    localRisks: ["Heat", "Event fences", "Busy weekend promenades"],
    nearby: [],
    parentCityGuideHref: "/guides/qld/brisbane-accessibility-guide",
    parentCityGuideLabel: "Brisbane Accessibility Guide",
    mappingMissions: [],
    lastUpdated: "2026-07-13",
    lastVerified: "2026-07-13",
  },
  {
    salCode: "SAL40010",
    name: "North Adelaide",
    state: "SA",
    stateSlug: "sa",
    lgaNames: ["Adelaide"],
    slug: "north-adelaide",
    latitude: -34.9070,
    longitude: 138.5950,
    guideStatus: "data-enriched",
    accessSummary:
      "Parklands-edge suburb with heritage streets and hospital approaches. Data-enriched transport notes exist; heritage entries still need careful checking.",
    confidenceScore: 55,
    accessThemes: ["transport", "health-support", "step-free", "parking-dropoff"],
    transportNotes: ["Bus and tram-adjacent links toward the city; confirm stop access."],
    toiletNotes: ["Hospital and park amenities vary — confirm visitor toilet access."],
    parkingDropoffNotes: ["Hospital precinct drop-off is often clearer than street parking."],
    stepFreeRouteNotes: ["Heritage frontages may include steps; choose main road corridors first."],
    sensoryNotes: ["Quiet residential pockets contrast with hospital traffic peaks."],
    venueHighlights: [],
    healthAndSupportAnchors: ["Major hospital precinct nearby — plan appointment transfer buffer."],
    localRisks: ["Heritage steps", "Peak hospital traffic"],
    nearby: [],
    parentCityGuideHref: "/guides/sa/adelaide-accessibility-guide",
    parentCityGuideLabel: "Adelaide Accessibility Guide",
    mappingMissions: [
      {
        id: "north-adelaide-dropoff",
        title: "Document hospital visitor drop-off rules",
        detail: "Include accessible bay notes and walking distances.",
      },
    ],
    lastUpdated: "2026-07-10",
    lastVerified: null,
  },
  {
    salCode: "SAL50640",
    name: "Fremantle",
    state: "WA",
    stateSlug: "wa",
    lgaNames: ["Fremantle"],
    slug: "fremantle",
    latitude: -32.0569,
    longitude: 115.7439,
    guideStatus: "community-reported",
    accessSummary:
      "Port city locality with heritage paving and waterfront attractions. Community reports flag good promenade segments and difficult heritage thresholds.",
    confidenceScore: 47,
    accessThemes: ["venues", "step-free", "toilets", "hazards"],
    transportNotes: ["Train terminus and bus links; verify station lift status."],
    toiletNotes: ["Waterfront public toilets need hours confirmation."],
    parkingDropoffNotes: ["Accessible parking clusters near the waterfront — confirm permits."],
    stepFreeRouteNotes: ["Promenade is stronger than some heritage shopping streets."],
    sensoryNotes: ["Weekend markets increase noise and crowd density."],
    venueHighlights: [],
    healthAndSupportAnchors: [],
    localRisks: ["Heritage thresholds", "Market crowds"],
    nearby: [],
    parentCityGuideHref: "/guides/wa/perth-accessibility-guide",
    parentCityGuideLabel: "Perth Accessibility Guide",
    mappingMissions: [
      {
        id: "freo-heritage",
        title: "Map step-free retail alternatives",
        detail: "Avoid cobbled pockets where possible.",
      },
    ],
    lastUpdated: "2026-07-07",
    lastVerified: null,
  },
  {
    salCode: "SAL60055",
    name: "Battery Point",
    state: "TAS",
    stateSlug: "tas",
    lgaNames: ["Hobart"],
    slug: "battery-point",
    latitude: -42.8910,
    longitude: 147.3350,
    guideStatus: "not-started",
    accessSummary:
      "Historic waterfront suburb. Guide shell only — gradients and heritage entries are expected challenges; do not treat this page as a finished access guide.",
    confidenceScore: 12,
    accessThemes: ["hazards", "step-free"],
    transportNotes: [],
    toiletNotes: [],
    parkingDropoffNotes: [],
    stepFreeRouteNotes: [],
    sensoryNotes: [],
    venueHighlights: [],
    healthAndSupportAnchors: [],
    localRisks: ["Steep heritage streets", "Narrow footpaths"],
    nearby: [],
    parentCityGuideHref: "/guides/tas/hobart-accessibility-guide",
    parentCityGuideLabel: "Hobart Accessibility Guide",
    mappingMissions: [
      {
        id: "battery-gradients",
        title: "Record gradient warnings",
        detail: "Identify streets that are unrealistic for many mobility aids.",
      },
      {
        id: "battery-toilets",
        title: "Locate nearest accessible toilets",
        detail: "Toward Salamanca / waterfront options.",
      },
    ],
    lastUpdated: "2026-07-01",
    lastVerified: null,
  },
  {
    salCode: "SAL70018",
    name: "Stuart Park",
    state: "NT",
    stateSlug: "nt",
    lgaNames: ["Darwin"],
    slug: "stuart-park",
    latitude: -12.4480,
    longitude: 130.8410,
    guideStatus: "draft",
    accessSummary:
      "Inner Darwin suburb between city and waterfront approaches. Draft sheet for heat-aware planning and bus links — incomplete.",
    confidenceScore: 28,
    accessThemes: ["transport", "hazards"],
    transportNotes: ["Bus links toward CBD and waterfront — confirm stop shade and seating."],
    toiletNotes: [],
    parkingDropoffNotes: [],
    stepFreeRouteNotes: [],
    sensoryNotes: ["Heat and glare are primary environmental loads."],
    venueHighlights: [],
    healthAndSupportAnchors: [],
    localRisks: ["Heat", "Wet-season path conditions"],
    nearby: [],
    parentCityGuideHref: "/guides/nt/darwin-accessibility-guide",
    parentCityGuideLabel: "Darwin Accessibility Guide",
    mappingMissions: [
      {
        id: "stuart-shade",
        title: "Map shade and rest points",
        detail: "Especially along longer footpath segments.",
      },
    ],
    lastUpdated: "2026-07-05",
    lastVerified: null,
  },
];

export const suburbAccessGuides: SuburbAccessGuide[] =
  suburbGuideSeeds.map(buildGuide);

export function getSuburbGuideByStateSlug(
  stateSlug: string,
  slug: string,
): SuburbAccessGuide | undefined {
  return suburbAccessGuides.find(
    (guide) => guide.stateSlug === stateSlug && guide.slug === slug,
  );
}

export function getSuburbGuidesByState(stateSlug: string): SuburbAccessGuide[] {
  return suburbAccessGuides.filter((guide) => guide.stateSlug === stateSlug);
}

export function getSuburbGuideStates(): string[] {
  return [...new Set(suburbAccessGuides.map((g) => g.stateSlug))].sort();
}

export function getFeaturedSuburbGuides(): SuburbAccessGuide[] {
  return suburbAccessGuides.filter((guide) =>
    ["mapable-verified", "mapable-reviewed", "partner-supplied", "data-enriched"].includes(
      guide.guideStatus,
    ),
  );
}

export type SuburbGuideFilterInput = {
  query?: string;
  stateSlug?: string | null;
  status?: SuburbGuideStatus | null;
  theme?: SuburbAccessTheme | null;
};

export function filterSuburbGuides(
  input: SuburbGuideFilterInput = {},
): SuburbAccessGuide[] {
  const query = input.query?.trim().toLowerCase() ?? "";
  return suburbAccessGuides.filter((guide) => {
    if (input.stateSlug && guide.stateSlug !== input.stateSlug) return false;
    if (input.status && guide.guideStatus !== input.status) return false;
    if (input.theme && !guide.accessThemes.includes(input.theme)) return false;
    if (!query) return true;
    const haystack = [
      guide.name,
      guide.state,
      guide.salCode,
      guide.accessSummary,
      ...guide.lgaNames,
      ...guide.accessThemes,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
}

export function formatSuburbGuideStatus(status: SuburbGuideStatus): string {
  switch (status) {
    case "not-started":
      return "Not started";
    case "draft":
      return "Draft";
    case "data-enriched":
      return "Data enriched";
    case "community-reported":
      return "Community reported";
    case "partner-supplied":
      return "Partner supplied";
    case "mapable-reviewed":
      return "MapAble reviewed";
    case "mapable-verified":
      return "MapAble verified";
    case "needs-local-verification":
      return "Needs local verification";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function formatSuburbAccessTheme(theme: SuburbAccessTheme): string {
  switch (theme) {
    case "transport":
      return "Transport";
    case "toilets":
      return "Toilets";
    case "parking-dropoff":
      return "Parking / drop-off";
    case "step-free":
      return "Step-free routes";
    case "sensory":
      return "Sensory";
    case "venues":
      return "Accessible venues";
    case "health-support":
      return "Health & support";
    case "hazards":
      return "Hazards";
    default: {
      const _exhaustive: never = theme;
      return _exhaustive;
    }
  }
}

/** Thin or unfinished guides should not be indexed by default. */
export function isSuburbGuideIndexable(guide: SuburbAccessGuide): boolean {
  if (
    guide.guideStatus === "not-started" ||
    guide.guideStatus === "draft" ||
    guide.guideStatus === "needs-local-verification"
  ) {
    return false;
  }
  if (guide.confidenceScore < 45) return false;
  const contentLength =
    guide.accessSummary.length +
    guide.transportNotes.join(" ").length +
    guide.toiletNotes.join(" ").length +
    guide.stepFreeRouteNotes.join(" ").length +
    guide.sensoryNotes.join(" ").length;
  return contentLength >= 180;
}

export function getIndexableSuburbGuides(): SuburbAccessGuide[] {
  return suburbAccessGuides.filter(isSuburbGuideIndexable);
}

export function suburbGuideSectionHref(
  guide: SuburbAccessGuide,
  section: SuburbGuideMapSection,
): string {
  return `${guide.href}#${section}`;
}
