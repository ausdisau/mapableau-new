/**
 * Starter sample suburb Access Guides from the MapAble Cursor Pack.
 * Canonical catalogue builds from these seeds plus additional coverage suburbs.
 *
 * Pack starter routes:
 * - /guides/suburbs/act/braddon
 * - /guides/suburbs/nsw/parramatta
 * - /guides/suburbs/vic/brunswick
 * - /guides/suburbs/qld/south-brisbane
 */
import type {
  SuburbAccessTheme,
  SuburbGuideMapSection,
  SuburbGuideStatus,
} from "@/types/suburb-access-guide";

export type SuburbGuideSampleSeed = {
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

export const suburbAccessGuideSamples: SuburbGuideSampleSeed[] = [
  {
    salCode: "SAL80145",
    name: "Braddon",
    state: "ACT",
    stateSlug: "act",
    lgaNames: ["Unincorporated ACT"],
    slug: "braddon",
    latitude: -35.2705,
    longitude: 149.134,
    guideStatus: "data-enriched",
    accessSummary:
      "Mixed residential and hospitality strip north of Canberra city. Useful for short food-and-footpath missions when gradients and crowded evenings are planned for.",
    confidenceScore: 58,
    accessThemes: ["step-free", "venues", "parking-dropoff", "sensory", "toilets"],
    transportNotes: [
      "Bus and light-rail connected; confirm kerb ramps at your boarding stop.",
      "Short rolls to Civic are possible on sealed footpaths — allow extra time on hotter days.",
    ],
    toiletNotes: [
      "Public toilets may be limited on retail stretches — check venue toilets and hours.",
      "Known accessible toilet data is still being checked for Changing Places needs.",
    ],
    parkingDropoffNotes: [
      "Street parking fills quickly; accessible bays need local confirmation.",
      "Drop-off near Lonsdale Street can reduce fatigue before dining.",
    ],
    stepFreeRouteNotes: [
      "Footpaths vary; survey the block you need rather than assuming continuous step-free retail frontage.",
    ],
    sensoryNotes: [
      "Evening hospitality noise can rise quickly; choose earlier visits if sound is a concern.",
      "Laneway seating can feel quieter mid-morning on weekdays.",
    ],
    venueHighlights: [
      {
        id: "braddon-dining",
        name: "Lonsdale Street dining strip",
        summary:
          "Many venues have step entries that vary — ask about step-free options before you go.",
        theme: "venues",
        hrefSection: "accessible-venues",
      },
    ],
    healthAndSupportAnchors: [],
    localRisks: [
      "Crowded weekend evenings",
      "Uneven terrace entries at some venues",
    ],
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
    salCode: "SAL13170",
    name: "Parramatta",
    state: "NSW",
    stateSlug: "nsw",
    lgaNames: ["City of Parramatta"],
    slug: "parramatta",
    latitude: -33.8151,
    longitude: 151.001,
    guideStatus: "partner-supplied",
    accessSummary:
      "Western Sydney civic and river precinct with metro, buses and dense shopping. Partner notes help with station lifts and river-walk planning — still confirm conditions on the day.",
    confidenceScore: 64,
    accessThemes: [
      "transport",
      "toilets",
      "step-free",
      "venues",
      "parking-dropoff",
      "hazards",
    ],
    transportNotes: [
      "Metro and bus interchange — verify lift status before relying on a single exit.",
      "River foreshore paths can link key precincts; check temporary works.",
    ],
    toiletNotes: [
      "Accessible toilets in major centres; plan a fallback toilet stop before travelling.",
      "Changing Places data for this locality still needs local verification.",
    ],
    parkingDropoffNotes: [
      "Accessible parking is clearer inside major centres than on street.",
      "Drop-off near Church Street plazas can shorten rolls in heat.",
    ],
    stepFreeRouteNotes: [
      "Prefer plaza and foreshore sealed paths; construction detours are common.",
    ],
    sensoryNotes: [
      "Lunch peaks and event days raise noise and crowding quickly.",
      "Riverside seating can offer a quieter reset away from mall corridors.",
    ],
    venueHighlights: [
      {
        id: "parra-square",
        name: "Civic and riverside plazas",
        summary: "Often usable sealed routes when lifts and bridges are operating.",
        theme: "step-free",
        hrefSection: "accessible-venues",
      },
    ],
    healthAndSupportAnchors: [
      "Hospital and clinic transfers should be planned separately from leisure outings.",
    ],
    localRisks: [
      "Heat on open plazas",
      "Construction detours around station exits",
      "Event-day crowd surges",
    ],
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
        id: "parra-lifts",
        title: "Audit metro and bus interchange lifts",
        detail: "Capture known outage patterns and step-free alternatives.",
      },
    ],
    lastUpdated: "2026-07-14",
    lastVerified: null,
  },
  {
    salCode: "SAL20354",
    name: "Brunswick",
    state: "VIC",
    stateSlug: "vic",
    lgaNames: ["Merri-bek"],
    slug: "brunswick",
    latitude: -37.7667,
    longitude: 144.961,
    guideStatus: "community-reported",
    accessSummary:
      "Inner-north Melbourne high street with tram corridor and mixed footpath quality. Community reports help flag quieter side streets and busy Sydney Road peaks — treat unfinished notes carefully.",
    confidenceScore: 52,
    accessThemes: ["transport", "sensory", "venues", "step-free", "toilets"],
    transportNotes: [
      "Trams along Sydney Road; confirm stop platforms and kerb ramps for your journey.",
      "Train station access needs local checking for step-free routes.",
    ],
    toiletNotes: [
      "Public toilet coverage is uneven — rely on venues until audits are complete.",
      "Plan a fallback toilet stop before travelling.",
    ],
    parkingDropoffNotes: [
      "Limited accessible street parking; booked drop-off near venues helps.",
    ],
    stepFreeRouteNotes: [
      "Side streets may be quieter and more predictable than the main shopping strip.",
      "Local verification is needed for kerb ramps and gradients on key crossings.",
    ],
    sensoryNotes: [
      "Sydney Road peaks can be noisy and visually busy.",
      "Parks and quieter residential streets can offer reset options.",
    ],
    venueHighlights: [],
    healthAndSupportAnchors: [],
    localRisks: [
      "Crowded tram stops at peak times",
      "Uneven shopfront entries",
      "Busy event nights",
    ],
    nearby: [
      {
        salCode: "SAL21104",
        name: "Carlton",
        state: "VIC",
        stateSlug: "vic",
        slug: "carlton",
      },
    ],
    parentCityGuideHref: "/guides/vic/melbourne-accessibility-guide",
    parentCityGuideLabel: "Melbourne Accessibility Guide",
    mappingMissions: [
      {
        id: "brunswick-quiet",
        title: "Map quieter outdoor seats",
        detail: "Away from Sydney Road peaks where possible.",
      },
      {
        id: "brunswick-toilets",
        title: "Confirm daytime accessible toilets",
        detail: "Hours, signage and step-free entry.",
      },
    ],
    lastUpdated: "2026-07-11",
    lastVerified: null,
  },
  {
    salCode: "SAL31420",
    name: "South Brisbane",
    state: "QLD",
    stateSlug: "qld",
    lgaNames: ["Brisbane City"],
    slug: "south-brisbane",
    latitude: -27.4766,
    longitude: 153.018,
    guideStatus: "mapable-reviewed",
    accessSummary:
      "Cultural and river precinct opposite the CBD. Strong for short cultural outings when you plan toilets, shade and ferry or bus links early.",
    confidenceScore: 70,
    accessThemes: [
      "transport",
      "toilets",
      "sensory",
      "venues",
      "step-free",
      "parking-dropoff",
    ],
    transportNotes: [
      "Bus, ferry and nearby train options — confirm lift and ramp status for your stop.",
      "Riverwalk segments are often sealed; heat and shade still matter.",
    ],
    toiletNotes: [
      "Accessible toilets at major cultural venues — confirm Changing Places needs before you go.",
    ],
    parkingDropoffNotes: [
      "Venue car parks usually offer clearer accessible bays than street spaces.",
      "Drop-off close to gallery entries can reduce fatigue.",
    ],
    stepFreeRouteNotes: [
      "Prefer South Bank parklands sealed paths; verify temporary path works.",
    ],
    sensoryNotes: [
      "Weekend crowds and outdoor events raise noise and visual load.",
      "Quieter riverside segments exist away from main event lawns.",
    ],
    venueHighlights: [
      {
        id: "south-bank",
        name: "South Bank Parklands",
        summary: "Sealed paths, shade pockets and venue toilets when hours are confirmed.",
        theme: "venues",
        hrefSection: "accessible-venues",
      },
    ],
    healthAndSupportAnchors: [],
    localRisks: [
      "Heat and glare on open river paths",
      "Event-day crowd surges",
      "Temporary path closures",
    ],
    nearby: [],
    parentCityGuideHref: "/guides/qld/brisbane-accessibility-guide",
    parentCityGuideLabel: "Brisbane Accessibility Guide",
    mappingMissions: [
      {
        id: "sb-changing-places",
        title: "Confirm Changing Places nearby",
        detail: "Hours, location notes and adult-change facilities.",
      },
    ],
    lastUpdated: "2026-07-15",
    lastVerified: "2026-07-10",
  },
];
