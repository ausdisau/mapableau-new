import {
  filterSuburbGuideList,
  formatSuburbAccessTheme,
  formatSuburbGuideStatus,
  isSuburbGuideIndexable,
  suburbGuideHref,
  suburbGuideMapHref,
  suburbGuideReportHref,
  suburbGuideStateHref,
  SUBURB_GUIDE_DISCLAIMER,
} from "@/lib/guides/suburb-guide-utils";
import type {
  SuburbAccessGuide,
  SuburbAccessTheme,
  SuburbGuideMapSection,
  SuburbGuideStatus,
  SuburbGuideVenueHighlight,
} from "@/types/suburb-access-guide";

import {
  suburbAccessGuideSamples,
  type SuburbGuideSampleSeed,
} from "../../src/data/suburbAccessGuides.sample";

export {
  filterSuburbGuideList,
  formatSuburbAccessTheme,
  formatSuburbGuideStatus,
  isSuburbGuideIndexable,
  suburbGuideHref,
  suburbGuideMapHref,
  suburbGuideReportHref,
  suburbGuideStateHref,
  SUBURB_GUIDE_DISCLAIMER,
};

export type { SuburbGuideFilterInput } from "@/lib/guides/suburb-guide-utils";

type SuburbGuideSeed = SuburbGuideSampleSeed;

function buildGuide(seed: SuburbGuideSeed): SuburbAccessGuide {
  const href = suburbGuideHref(seed.stateSlug, seed.slug);
  return {
    id: `${seed.stateSlug}-${seed.slug}`,
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
      href: suburbGuideHref(n.stateSlug, n.slug),
    })),
    parentCityGuideHref: seed.parentCityGuideHref,
    parentCityGuideLabel: seed.parentCityGuideLabel,
    dataSources: [
      {
        id: "abs-sal",
        label: "ABS Suburbs and Localities (SAL)",
        sourceType: "official-boundary",
        note: "Canonical suburb/locality geography for MapAble suburb guides.",
      },
      {
        id: "mapable-community",
        label: "MapAble access notes",
        sourceType: "mapable",
        note: "Community and partner planning notes; always re-check on the day.",
      },
    ],
    mappingMissions: seed.mappingMissions,
    lastUpdated: seed.lastUpdated,
    lastVerified: seed.lastVerified,
    href,
    mapHref: suburbGuideMapHref(seed.stateSlug, seed.slug),
    reportHref: suburbGuideReportHref(seed.stateSlug, seed.slug),
  };
}

/**
 * Additional coverage seeds beyond the Cursor Pack starter samples.
 * Keep pack samples as the primary examples; do not duplicate their slugs.
 */
const additionalSuburbGuideSeeds: SuburbGuideSeed[] = [
  {
    salCode: "SAL80026",
    name: "Acton",
    state: "ACT",
    stateSlug: "act",
    lgaNames: ["Unincorporated ACT"],
    slug: "acton",
    latitude: -35.282,
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
    salCode: "SAL80120",
    name: "City",
    state: "ACT",
    stateSlug: "act",
    lgaNames: ["Unincorporated ACT"],
    slug: "city",
    latitude: -35.2801,
    longitude: 149.131,
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
    latitude: -33.869,
    longitude: 151.195,
    guideStatus: "partner-supplied",
    accessSummary:
      "Harbour-edge suburb with light rail, steep pockets and event crowds. Partner notes help with ferry and light-rail planning — still confirm steps and lift status on the day.",
    confidenceScore: 66,
    accessThemes: ["transport", "step-free", "venues", "hazards"],
    transportNotes: [
      "Light rail and ferry-adjacent links; verify lift outages before relying on a single stop.",
    ],
    toiletNotes: ["Public waterfront toilets need hours confirmation."],
    parkingDropoffNotes: [
      "Limited accessible street parking; use venue or car-park access notes.",
    ],
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
      {
        salCode: "SAL13170",
        name: "Parramatta",
        state: "NSW",
        stateSlug: "nsw",
        slug: "parramatta",
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
    latitude: -33.879,
    longitude: 151.2,
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
    longitude: 144.967,
    guideStatus: "needs-local-verification",
    accessSummary:
      "University and museum precinct suburb. Draft notes exist for tram corridors and parks, but gradients, laneway dining and toilet details still need local verification.",
    confidenceScore: 38,
    accessThemes: ["transport", "venues", "toilets", "sensory"],
    transportNotes: [
      "Tram spine along Swanston/Lygon corridors — confirm level-access stops.",
    ],
    toiletNotes: ["Museum and park toilets need fresh hours and adult-change checks."],
    parkingDropoffNotes: [
      "Permit and ticketed parking mix; verify accessible bays locally.",
    ],
    stepFreeRouteNotes: ["Main avenues are stronger than bluestone laneways."],
    sensoryNotes: ["Festival and student peaks change noise suddenly."],
    venueHighlights: [],
    healthAndSupportAnchors: [],
    localRisks: ["Bluestone laneways", "Crowd peaks"],
    nearby: [
      {
        salCode: "SAL20354",
        name: "Brunswick",
        state: "VIC",
        stateSlug: "vic",
        slug: "brunswick",
      },
    ],
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
    salCode: "SAL40010",
    name: "North Adelaide",
    state: "SA",
    stateSlug: "sa",
    lgaNames: ["Adelaide"],
    slug: "north-adelaide",
    latitude: -34.907,
    longitude: 138.595,
    guideStatus: "data-enriched",
    accessSummary:
      "Parklands-edge suburb with heritage streets and hospital approaches. Data-enriched transport notes exist; heritage entries still need careful checking.",
    confidenceScore: 55,
    accessThemes: ["transport", "health-support", "step-free", "parking-dropoff"],
    transportNotes: ["Bus and tram-adjacent links toward the city; confirm stop access."],
    toiletNotes: ["Hospital and park amenities vary — confirm visitor toilet access."],
    parkingDropoffNotes: [
      "Hospital precinct drop-off is often clearer than street parking.",
    ],
    stepFreeRouteNotes: [
      "Parklands paths can be strong; heritage streets may have steps or uneven stone.",
    ],
    sensoryNotes: ["Open parklands can be windy and bright."],
    venueHighlights: [],
    healthAndSupportAnchors: [
      "Hospital approaches benefit from separate appointment-day planning.",
    ],
    localRisks: ["Heritage steps", "Heat on exposed parkland paths"],
    nearby: [],
    parentCityGuideHref: "/guides/sa/adelaide-accessibility-guide",
    parentCityGuideLabel: "Adelaide Accessibility Guide",
    mappingMissions: [
      {
        id: "na-heritage",
        title: "Flag heritage entries with steps",
        detail: "Note venues with step-free alternatives nearby.",
      },
    ],
    lastUpdated: "2026-07-10",
    lastVerified: null,
  },
  {
    salCode: "SAL50455",
    name: "Fremantle",
    state: "WA",
    stateSlug: "wa",
    lgaNames: ["Fremantle"],
    slug: "fremantle",
    latitude: -32.0569,
    longitude: 115.7439,
    guideStatus: "community-reported",
    accessSummary:
      "Harbour and heritage tourist suburb. Community notes help with waterfront toilets and crowded weekends — gradients and cobbles still need checking.",
    confidenceScore: 49,
    accessThemes: ["toilets", "sensory", "step-free", "transport", "hazards"],
    transportNotes: ["Train and bus links; confirm station step-free details."],
    toiletNotes: ["Waterfront public toilets need hours confirmation."],
    parkingDropoffNotes: ["Use centre car parks for clearer accessible bays on weekends."],
    stepFreeRouteNotes: [
      "Some heritage streets have cobbles or steps — prefer main sealed waterfront paths.",
    ],
    sensoryNotes: ["Weekend tourist peaks are loud and crowded."],
    venueHighlights: [],
    healthAndSupportAnchors: [],
    localRisks: ["Cobbles", "Weekend crowds", "Exposed waterfront wind"],
    nearby: [],
    parentCityGuideHref: "/guides/wa/perth-accessibility-guide",
    parentCityGuideLabel: "Perth Accessibility Guide",
    mappingMissions: [
      {
        id: "freo-surfaces",
        title: "Map cobble vs sealed routes",
        detail: "Identify predictable step-free waterfront segments.",
      },
    ],
    lastUpdated: "2026-07-07",
    lastVerified: null,
  },
  {
    salCode: "SAL60088",
    name: "Battery Point",
    state: "TAS",
    stateSlug: "tas",
    lgaNames: ["Hobart"],
    slug: "battery-point",
    latitude: -42.8895,
    longitude: 147.333,
    guideStatus: "draft",
    accessSummary:
      "Compact heritage suburb near Salamanca. Draft guide — steep streets and cobbles mean local verification is essential before treating routes as usable.",
    confidenceScore: 28,
    accessThemes: ["step-free", "hazards", "transport"],
    transportNotes: ["Short distance to ferry and bus corridors; hills dominate."],
    toiletNotes: ["Rely on Salamanca and waterfront amenities until audits are finished."],
    parkingDropoffNotes: ["Limited accessible street parking; prefer booked drop-off."],
    stepFreeRouteNotes: [
      "Many streets are steep; do not assume continuous step-free access.",
    ],
    sensoryNotes: ["Quiet mid-week mornings; market days increase load nearby."],
    venueHighlights: [],
    healthAndSupportAnchors: [],
    localRisks: ["Steep gradients", "Cobbles", "Narrow footpaths"],
    nearby: [],
    parentCityGuideHref: "/guides/tas/hobart-accessibility-guide",
    parentCityGuideLabel: "Hobart Accessibility Guide",
    mappingMissions: [
      {
        id: "bp-gradients",
        title: "Record steep street grades",
        detail: "Flag routes that are impractical for many mobility aids.",
      },
    ],
    lastUpdated: "2026-07-05",
    lastVerified: null,
  },
  {
    salCode: "SAL70055",
    name: "Stuart Park",
    state: "NT",
    stateSlug: "nt",
    lgaNames: ["Darwin"],
    slug: "stuart-park",
    latitude: -12.447,
    longitude: 130.842,
    guideStatus: "needs-local-verification",
    accessSummary:
      "Inner Darwin suburb near foreshore corridors. Transport and heat-risk notes are started; toilets and step-free detail need local verification.",
    confidenceScore: 36,
    accessThemes: ["transport", "hazards", "parking-dropoff"],
    transportNotes: ["Bus links toward the CBD; confirm stop access."],
    toiletNotes: ["Public toilet information is not yet verified for this locality."],
    parkingDropoffNotes: ["Shade at drop-off points matters in wet-season heat."],
    stepFreeRouteNotes: ["Verify kerb ramps on key crossings before relying on them."],
    sensoryNotes: ["Heat and humidity are primary loads for many travellers."],
    venueHighlights: [],
    healthAndSupportAnchors: [],
    localRisks: ["Heat", "Wet-season storms", "Exposed outdoor links"],
    nearby: [],
    parentCityGuideHref: "/guides/nt/darwin-accessibility-guide",
    parentCityGuideLabel: "Darwin Accessibility Guide",
    mappingMissions: [
      {
        id: "stuart-toilets",
        title: "Verify accessible toilets",
        detail: "Hours, shade and step-free entry.",
      },
    ],
    lastUpdated: "2026-07-06",
    lastVerified: null,
  },
];

const sampleKeys = new Set(
  suburbAccessGuideSamples.map((s) => `${s.stateSlug}/${s.slug}`),
);

const mergedSeeds: SuburbGuideSeed[] = [
  ...suburbAccessGuideSamples,
  ...additionalSuburbGuideSeeds.filter(
    (seed) => !sampleKeys.has(`${seed.stateSlug}/${seed.slug}`),
  ),
];

/**
 * Seed catalogue for the national suburb guide system.
 * Additional SAL localities can be imported without new page templates.
 */
export const suburbAccessGuides: SuburbAccessGuide[] =
  mergedSeeds.map(buildGuide);

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
    [
      "mapable-verified",
      "mapable-reviewed",
      "partner-supplied",
      "data-enriched",
    ].includes(guide.guideStatus),
  );
}

export function filterSuburbGuides(
  input: Parameters<typeof filterSuburbGuideList>[1] = {},
): SuburbAccessGuide[] {
  return filterSuburbGuideList(suburbAccessGuides, input);
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

/** @deprecated Prefer importing status types from @/types/suburb-access-guide */
export type { SuburbAccessTheme, SuburbGuideStatus };
