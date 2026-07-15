import { buildHarbourAccessGraph } from "./living/harbour-civic";
import type {
  AccessFeature,
  AccessPassport,
  BuildingElement,
  Evidence,
  LiveIncident,
  Place,
  RouteEdge,
  RouteNode,
} from "./schemas";
import type { AccessGraph } from "./types";

const NOW = "2026-07-10T09:00:00.000Z";
const RECENT = "2026-06-01T00:00:00.000Z";
const OUTDATED = "2024-01-15T00:00:00.000Z";

export const DEMO_USER_ID = "demo-access-intelligence-user";

function req(
  id: string,
  featureType: AccessPassport["requirements"][number]["featureType"],
  importance: AccessPassport["requirements"][number]["importance"],
  operator: AccessPassport["requirements"][number]["operator"],
  value: string | number | boolean,
  unit?: string,
) {
  return {
    id,
    featureType,
    importance,
    operator,
    value,
    unit,
    shareWithVenue: importance === "required",
  };
}

export const DEMO_PASSPORT_TEMPLATES: Array<Omit<AccessPassport, "userId" | "createdAt" | "updatedAt">> = [
  {
    id: "passport-power-chair",
    name: "Power-chair access",
    isDefault: true,
    requirements: [
      req("r-step-free", "step_free", "required", "available", true),
      req("r-door", "clear_door_width_mm", "required", "minimum", 850, "mm"),
      req("r-lift-door", "lift_door_width_mm", "required", "minimum", 850, "mm"),
      req("r-corridor", "corridor_width_mm", "required", "minimum", 900, "mm"),
      req("r-lift", "lift", "required", "available", true),
      req("r-toilet", "accessible_toilet", "preferred", "available", true),
      req("r-staff", "staff_assistance", "helpful", "available", true),
    ],
    communicationPreferences: ["plain_language", "written"],
    mobilityAids: ["power_chair"],
    sharingDefaults: {
      shareRequiredWithVenue: true,
      sharePreferredWithVenue: false,
      shareHelpfulWithVenue: false,
      purpose: "Visit planning",
      durationHours: 24,
    },
  },
  {
    id: "passport-step-free",
    name: "Step-free essentials",
    isDefault: false,
    requirements: [
      req("sf-1", "step_free", "required", "available", true),
      req("sf-2", "accessible_toilet", "preferred", "available", true),
    ],
    communicationPreferences: ["plain_language"],
    mobilityAids: ["manual_wheelchair"],
    sharingDefaults: {
      shareRequiredWithVenue: true,
      sharePreferredWithVenue: false,
      shareHelpfulWithVenue: false,
    },
  },
  {
    id: "passport-sensory",
    name: "Sensory-friendly visit",
    isDefault: false,
    requirements: [
      req("sens-1", "quiet_waiting_area", "preferred", "available", true),
      req("sens-2", "low_glare_lighting", "helpful", "available", true),
      req("sens-3", "step_free", "preferred", "available", true),
    ],
    communicationPreferences: ["plain_language", "written"],
    mobilityAids: ["none"],
    sharingDefaults: {
      shareRequiredWithVenue: false,
      sharePreferredWithVenue: true,
      shareHelpfulWithVenue: false,
    },
  },
  {
    id: "passport-vision",
    name: "Blind or low-vision navigation",
    isDefault: false,
    requirements: [
      req("vis-1", "tactile_wayfinding", "preferred", "available", true),
      req("vis-2", "audio_wayfinding", "preferred", "available", true),
      req("vis-3", "staff_assistance", "helpful", "available", true),
    ],
    communicationPreferences: ["spoken", "plain_language"],
    mobilityAids: ["cane"],
    sharingDefaults: {
      shareRequiredWithVenue: false,
      sharePreferredWithVenue: true,
      shareHelpfulWithVenue: false,
    },
  },
  {
    id: "passport-hearing",
    name: "Deaf or hard-of-hearing communication",
    isDefault: false,
    requirements: [
      req("hear-1", "hearing_augmentation", "preferred", "available", true),
      req("hear-2", "captions", "preferred", "available", true),
      req("hear-3", "preferred_communication_mode", "helpful", "equals", "written"),
    ],
    communicationPreferences: ["written", "captions", "auslan"],
    mobilityAids: ["none"],
    sharingDefaults: {
      shareRequiredWithVenue: false,
      sharePreferredWithVenue: true,
      shareHelpfulWithVenue: false,
    },
  },
  {
    id: "passport-fatigue",
    name: "Fatigue-aware visit",
    isDefault: false,
    requirements: [
      req("fat-1", "seating_interval_m", "preferred", "maximum", 50, "m"),
      req("fat-2", "lift", "preferred", "available", true),
      req("fat-3", "staff_assistance", "helpful", "available", true),
    ],
    communicationPreferences: ["plain_language"],
    mobilityAids: ["none"],
    sharingDefaults: {
      shareRequiredWithVenue: false,
      sharePreferredWithVenue: false,
      shareHelpfulWithVenue: false,
    },
  },
  {
    id: "passport-animal",
    name: "Assistance-animal visit",
    isDefault: false,
    requirements: [
      req("aa-1", "assistance_animal_access", "required", "available", true),
      req("aa-2", "step_free", "preferred", "available", true),
    ],
    communicationPreferences: ["plain_language"],
    mobilityAids: ["assistance_animal"],
    sharingDefaults: {
      shareRequiredWithVenue: true,
      sharePreferredWithVenue: false,
      shareHelpfulWithVenue: false,
    },
  },
];

export function createDemoPassports(userId: string = DEMO_USER_ID): AccessPassport[] {
  return DEMO_PASSPORT_TEMPLATES.map((t) => ({
    ...t,
    userId,
    createdAt: NOW,
    updatedAt: NOW,
  }));
}

// —— Harbour Civic Centre (Living Building) ——
// Canonical twin: ./living/harbour-civic.ts (shared by Visit / Learn / Operate / Improve).
const harbourGraph = buildHarbourAccessGraph();

// —— Riverside Community Hall (unknowns) ——
const RCH_PLACE: Place = {
  id: "place-riverside-hall",
  name: "Riverside Community Hall",
  address: "12 Synthetic River Rd, Demo Bend NSW 2100",
  category: "community",
  operator: "Demo Bend Community Assoc",
  openingHours: "Daily 9:00–21:00",
  baselineScore: 58,
  accreditationTier: "synthetic-demo",
  lastVerifiedAt: OUTDATED,
};

const rchElements: BuildingElement[] = [
  { id: "rch-ent", placeId: RCH_PLACE.id, type: "entrance", name: "Main entrance", level: "G" },
  { id: "rch-hall", placeId: RCH_PLACE.id, type: "room", name: "Main hall", level: "G" },
  { id: "rch-toilet", placeId: RCH_PLACE.id, type: "toilet", name: "Accessible toilet", level: "G" },
];

const rchEvidence: Evidence[] = [
  {
    id: "ev-rch-stepfree",
    type: "measurement",
    title: "Step-free entrance",
    capturedAt: RECENT,
    sourceName: "Trained mapper",
    sourceType: "trained_mapper",
    status: "verified",
  },
  {
    id: "ev-rch-toilet-old",
    type: "photograph",
    title: "Accessible toilet (outdated)",
    capturedAt: OUTDATED,
    sourceName: "Community report",
    sourceType: "community_report",
    status: "expired",
  },
  {
    id: "ev-rch-hearing",
    type: "venue_statement",
    title: "Hearing loop claimed",
    capturedAt: RECENT,
    sourceName: "Venue manager",
    sourceType: "venue_attestation",
    status: "provisional",
  },
];

const rchFeatures: AccessFeature[] = [
  {
    id: "f-rch-step",
    placeId: RCH_PLACE.id,
    elementId: "rch-ent",
    featureType: "step_free",
    value: true,
    sourceType: "trained_mapper",
    observedAt: RECENT,
    evidenceIds: ["ev-rch-stepfree"],
    confidence: 0.82,
    disputed: false,
  },
  {
    id: "f-rch-door",
    placeId: RCH_PLACE.id,
    elementId: "rch-ent",
    featureType: "clear_door_width_mm",
    value: 900,
    unit: "mm",
    sourceType: "trained_mapper",
    observedAt: RECENT,
    evidenceIds: ["ev-rch-stepfree"],
    confidence: 0.82,
    disputed: false,
  },
  {
    id: "f-rch-toilet",
    placeId: RCH_PLACE.id,
    elementId: "rch-toilet",
    featureType: "accessible_toilet",
    value: true,
    sourceType: "community_report",
    observedAt: OUTDATED,
    evidenceIds: ["ev-rch-toilet-old"],
    confidence: 0.4,
    disputed: false,
    notes: "Evidence outdated — treat carefully.",
  },
  {
    id: "f-rch-hearing",
    placeId: RCH_PLACE.id,
    elementId: "rch-hall",
    featureType: "hearing_augmentation",
    value: true,
    sourceType: "venue_attestation",
    observedAt: RECENT,
    evidenceIds: ["ev-rch-hearing"],
    confidence: 0.75,
    disputed: false,
    notes: "Venue-attested only — not independently verified.",
  },
];

const rchNodes: RouteNode[] = [
  { id: "n-rch-ent", placeId: RCH_PLACE.id, elementId: "rch-ent", label: "Main entrance", level: "G", nodeType: "entrance" },
  { id: "n-rch-hall", placeId: RCH_PLACE.id, elementId: "rch-hall", label: "Main hall", level: "G", nodeType: "room" },
];

const rchEdges: RouteEdge[] = [
  {
    id: "e-rch-ent-hall",
    fromNodeId: "n-rch-ent",
    toNodeId: "n-rch-hall",
    distanceMetres: 30,
    widthMm: 900,
    steps: 0,
    temporaryBarrier: false,
    evidenceConfidence: 0.7,
  },
];

// —— Northside Library (lift outage + alternative) ——
const NSL_PLACE: Place = {
  id: "place-northside-library",
  name: "Northside Library",
  address: "5 Synthetic Library Lane, Demo North NSW 2060",
  category: "library",
  operator: "Demo North Council",
  openingHours: "Mon–Sat 9:00–18:00",
  baselineScore: 65,
  accreditationTier: "synthetic-demo",
  lastVerifiedAt: RECENT,
};

const nslElements: BuildingElement[] = [
  { id: "nsl-ent", placeId: NSL_PLACE.id, type: "entrance", name: "Main entrance", level: "G" },
  { id: "nsl-lift-main", placeId: NSL_PLACE.id, type: "lift", name: "Main lift", level: "G-2" },
  { id: "nsl-lift-alt", placeId: NSL_PLACE.id, type: "lift", name: "Service lift (alternative)", level: "G-2" },
  { id: "nsl-corr-blocked", placeId: NSL_PLACE.id, type: "corridor", name: "Short corridor (blocked)", level: "2" },
  { id: "nsl-corr-alt", placeId: NSL_PLACE.id, type: "corridor", name: "Long corridor (open)", level: "2" },
  { id: "nsl-room", placeId: NSL_PLACE.id, type: "room", name: "Study Room 2.04", level: "2" },
];

const nslEvidence: Evidence[] = [
  {
    id: "ev-nsl-step",
    type: "measurement",
    title: "Step-free entrance",
    capturedAt: RECENT,
    sourceName: "Qualified assessor",
    sourceType: "qualified_assessor",
    status: "verified",
  },
  {
    id: "ev-nsl-lifts",
    type: "system_status",
    title: "Lift inventory",
    capturedAt: RECENT,
    sourceName: "Building BMS (synthetic)",
    sourceType: "system_feed",
    status: "verified",
  },
];

const nslFeatures: AccessFeature[] = [
  {
    id: "f-nsl-step",
    placeId: NSL_PLACE.id,
    elementId: "nsl-ent",
    featureType: "step_free",
    value: true,
    sourceType: "qualified_assessor",
    observedAt: RECENT,
    evidenceIds: ["ev-nsl-step"],
    confidence: 1,
    disputed: false,
  },
  {
    id: "f-nsl-door",
    placeId: NSL_PLACE.id,
    elementId: "nsl-ent",
    featureType: "clear_door_width_mm",
    value: 920,
    unit: "mm",
    sourceType: "qualified_assessor",
    observedAt: RECENT,
    evidenceIds: ["ev-nsl-step"],
    confidence: 1,
    disputed: false,
  },
  {
    id: "f-nsl-lift",
    placeId: NSL_PLACE.id,
    elementId: "nsl-lift-alt",
    featureType: "lift",
    value: true,
    sourceType: "system_feed",
    observedAt: RECENT,
    evidenceIds: ["ev-nsl-lifts"],
    confidence: 0.95,
    disputed: false,
  },
  {
    id: "f-nsl-lift-door",
    placeId: NSL_PLACE.id,
    elementId: "nsl-lift-alt",
    featureType: "lift_door_width_mm",
    value: 900,
    unit: "mm",
    sourceType: "system_feed",
    observedAt: RECENT,
    evidenceIds: ["ev-nsl-lifts"],
    confidence: 0.95,
    disputed: false,
  },
  {
    id: "f-nsl-corr",
    placeId: NSL_PLACE.id,
    elementId: "nsl-corr-alt",
    featureType: "corridor_width_mm",
    value: 1200,
    unit: "mm",
    sourceType: "qualified_assessor",
    observedAt: RECENT,
    evidenceIds: ["ev-nsl-step"],
    confidence: 0.9,
    disputed: false,
  },
];

const nslNodes: RouteNode[] = [
  { id: "n-nsl-ent", placeId: NSL_PLACE.id, elementId: "nsl-ent", label: "Main entrance", level: "G", nodeType: "entrance" },
  { id: "n-nsl-lift-main-g", placeId: NSL_PLACE.id, elementId: "nsl-lift-main", label: "Main lift (ground)", level: "G", nodeType: "lift" },
  { id: "n-nsl-lift-main-2", placeId: NSL_PLACE.id, elementId: "nsl-lift-main", label: "Main lift (level 2)", level: "2", nodeType: "lift" },
  { id: "n-nsl-lift-alt-g", placeId: NSL_PLACE.id, elementId: "nsl-lift-alt", label: "Service lift (ground)", level: "G", nodeType: "lift" },
  { id: "n-nsl-lift-alt-2", placeId: NSL_PLACE.id, elementId: "nsl-lift-alt", label: "Service lift (level 2)", level: "2", nodeType: "lift" },
  { id: "n-nsl-short", placeId: NSL_PLACE.id, elementId: "nsl-corr-blocked", label: "Short corridor", level: "2", nodeType: "corridor" },
  { id: "n-nsl-long", placeId: NSL_PLACE.id, elementId: "nsl-corr-alt", label: "Long corridor", level: "2", nodeType: "corridor" },
  { id: "n-nsl-room", placeId: NSL_PLACE.id, elementId: "nsl-room", label: "Study Room 2.04", level: "2", nodeType: "room" },
];

const nslEdges: RouteEdge[] = [
  {
    id: "e-nsl-ent-main",
    fromNodeId: "n-nsl-ent",
    toNodeId: "n-nsl-lift-main-g",
    distanceMetres: 10,
    widthMm: 920,
    steps: 0,
    temporaryBarrier: false,
    evidenceConfidence: 0.95,
  },
  {
    id: "e-nsl-ent-alt",
    fromNodeId: "n-nsl-ent",
    toNodeId: "n-nsl-lift-alt-g",
    distanceMetres: 40,
    widthMm: 920,
    steps: 0,
    temporaryBarrier: false,
    evidenceConfidence: 0.95,
  },
  {
    id: "e-nsl-main-lift",
    fromNodeId: "n-nsl-lift-main-g",
    toNodeId: "n-nsl-lift-main-2",
    distanceMetres: 5,
    widthMm: 900,
    steps: 0,
    liftAvailable: true,
    temporaryBarrier: false,
    evidenceConfidence: 0.5,
  },
  {
    id: "e-nsl-alt-lift",
    fromNodeId: "n-nsl-lift-alt-g",
    toNodeId: "n-nsl-lift-alt-2",
    distanceMetres: 5,
    widthMm: 900,
    steps: 0,
    liftAvailable: true,
    temporaryBarrier: false,
    evidenceConfidence: 0.95,
  },
  {
    id: "e-nsl-main-short",
    fromNodeId: "n-nsl-lift-main-2",
    toNodeId: "n-nsl-short",
    distanceMetres: 8,
    widthMm: 1200,
    steps: 0,
    temporaryBarrier: false,
    evidenceConfidence: 0.4,
  },
  {
    id: "e-nsl-short-room",
    fromNodeId: "n-nsl-short",
    toNodeId: "n-nsl-room",
    distanceMetres: 5,
    widthMm: 1200,
    steps: 0,
    temporaryBarrier: true,
    evidenceConfidence: 0.4,
  },
  {
    id: "e-nsl-alt-long",
    fromNodeId: "n-nsl-lift-alt-2",
    toNodeId: "n-nsl-long",
    distanceMetres: 25,
    widthMm: 1200,
    steps: 0,
    temporaryBarrier: false,
    evidenceConfidence: 0.95,
  },
  {
    id: "e-nsl-long-room",
    fromNodeId: "n-nsl-long",
    toNodeId: "n-nsl-room",
    distanceMetres: 20,
    widthMm: 1200,
    steps: 0,
    temporaryBarrier: false,
    evidenceConfidence: 0.95,
  },
];

export const DEMO_INCIDENTS: LiveIncident[] = [
  {
    id: "inc-nsl-lift",
    placeId: NSL_PLACE.id,
    elementId: "nsl-lift-main",
    type: "lift_outage",
    severity: "high",
    description: "Main lift out of service until further notice (synthetic demo).",
    sourceType: "system_feed",
    reportedAt: NOW,
    confirmedAt: NOW,
    status: "active",
    affectedEdgeIds: ["e-nsl-main-lift", "e-nsl-main-short"],
  },
  {
    id: "inc-nsl-corr",
    placeId: NSL_PLACE.id,
    elementId: "nsl-corr-blocked",
    type: "blocked_route",
    severity: "moderate",
    description: "Short corridor temporarily blocked for maintenance (synthetic demo).",
    sourceType: "venue_attestation",
    reportedAt: NOW,
    status: "active",
    affectedEdgeIds: ["e-nsl-short-room"],
  },
  {
    id: "inc-hub-door",
    placeId: "place-mapable-community-hub",
    elementId: "hub-auto-door",
    type: "automatic_door_fault",
    severity: "moderate",
    description: "Automatic door at Entrance West intermittent (synthetic demo).",
    sourceType: "community_report",
    reportedAt: NOW,
    status: "active",
    affectedEdgeIds: ["e-hub-west-rec"],
  },
];

// —— MapAble Community Hub (canonical fictional demo venue) ——
const HUB_PLACE: Place = {
  id: "place-mapable-community-hub",
  name: "MapAble Community Hub",
  address: "1 Access Way, Demo Park NSW 2009",
  category: "community_hub",
  operator: "MapAble Demo Operations",
  openingHours: "Mon–Fri 8:00–18:00",
  baselineScore: 70,
  accreditationTier: "synthetic-demo",
  lastVerifiedAt: RECENT,
};

const hubElements: BuildingElement[] = [
  { id: "hub-drop", placeId: HUB_PLACE.id, type: "drop_off", name: "Accessible drop-off", level: "G" },
  { id: "hub-east", placeId: HUB_PLACE.id, type: "entrance", name: "Entrance East (steps)", level: "G" },
  { id: "hub-west", placeId: HUB_PLACE.id, type: "entrance", name: "Entrance West (step-free)", level: "G" },
  { id: "hub-auto-door", placeId: HUB_PLACE.id, type: "door", name: "Entrance West automatic door", level: "G" },
  { id: "hub-reception", placeId: HUB_PLACE.id, type: "reception", name: "Reception", level: "G" },
  { id: "hub-lift", placeId: HUB_PLACE.id, type: "lift", name: "Passenger lift", level: "G-2" },
  { id: "hub-quiet", placeId: HUB_PLACE.id, type: "quiet_space", name: "Quiet room", level: "G" },
  { id: "hub-toilet", placeId: HUB_PLACE.id, type: "toilet", name: "Accessible toilet", level: "G" },
  { id: "hub-meeting", placeId: HUB_PLACE.id, type: "room", name: "Meeting Room 2.1", level: "2" },
];

const hubEvidence: Evidence[] = [
  {
    id: "ev-hub-east-steps",
    type: "measurement",
    title: "Entrance East has 3 steps",
    capturedAt: RECENT,
    sourceName: "Synthetic assessor",
    sourceType: "qualified_assessor",
    measurement: { value: 3, unit: "steps" },
    calibrationConfirmed: true,
    status: "verified",
  },
  {
    id: "ev-hub-west-level",
    type: "measurement",
    title: "Entrance West step-free, 920 mm clear",
    capturedAt: RECENT,
    sourceName: "Synthetic assessor",
    sourceType: "qualified_assessor",
    measurement: { value: 920, unit: "mm" },
    calibrationConfirmed: true,
    status: "verified",
  },
  {
    id: "ev-hub-lift",
    type: "measurement",
    title: "Lift door 880 mm; audible announcements",
    capturedAt: RECENT,
    sourceName: "Synthetic assessor",
    sourceType: "qualified_assessor",
    status: "verified",
  },
  {
    id: "ev-hub-toilet",
    type: "photograph",
    title: "Accessible toilet ground floor",
    capturedAt: RECENT,
    sourceName: "Trained mapper",
    sourceType: "trained_mapper",
    status: "verified",
  },
  {
    id: "ev-hub-quiet",
    type: "venue_statement",
    title: "Quiet room available on request",
    capturedAt: RECENT,
    sourceName: "Hub manager",
    sourceType: "venue_attestation",
    status: "provisional",
  },
  {
    id: "ev-hub-glare",
    type: "community_observation",
    title: "Low-glare lighting claimed in quiet room",
    capturedAt: OUTDATED,
    sourceName: "Community reporter",
    sourceType: "community_report",
    status: "expired",
  },
];

const hubFeatures: AccessFeature[] = [
  {
    id: "f-hub-east-step",
    placeId: HUB_PLACE.id,
    elementId: "hub-east",
    featureType: "step_free",
    value: false,
    sourceType: "qualified_assessor",
    observedAt: RECENT,
    evidenceIds: ["ev-hub-east-steps"],
    confidence: 1,
    disputed: false,
  },
  {
    id: "f-hub-west-step",
    placeId: HUB_PLACE.id,
    elementId: "hub-west",
    featureType: "step_free",
    value: true,
    sourceType: "qualified_assessor",
    observedAt: RECENT,
    evidenceIds: ["ev-hub-west-level"],
    confidence: 1,
    disputed: false,
  },
  {
    id: "f-hub-west-width",
    placeId: HUB_PLACE.id,
    elementId: "hub-west",
    featureType: "clear_door_width_mm",
    value: 920,
    unit: "mm",
    sourceType: "qualified_assessor",
    observedAt: RECENT,
    evidenceIds: ["ev-hub-west-level"],
    confidence: 1,
    disputed: false,
  },
  {
    id: "f-hub-lift",
    placeId: HUB_PLACE.id,
    elementId: "hub-lift",
    featureType: "lift",
    value: true,
    sourceType: "qualified_assessor",
    observedAt: RECENT,
    evidenceIds: ["ev-hub-lift"],
    confidence: 1,
    disputed: false,
  },
  {
    id: "f-hub-lift-door",
    placeId: HUB_PLACE.id,
    elementId: "hub-lift",
    featureType: "lift_door_width_mm",
    value: 880,
    unit: "mm",
    sourceType: "qualified_assessor",
    observedAt: RECENT,
    evidenceIds: ["ev-hub-lift"],
    confidence: 1,
    disputed: false,
  },
  {
    id: "f-hub-audio",
    placeId: HUB_PLACE.id,
    elementId: "hub-lift",
    featureType: "audio_wayfinding",
    value: true,
    sourceType: "qualified_assessor",
    observedAt: RECENT,
    evidenceIds: ["ev-hub-lift"],
    confidence: 0.9,
    disputed: false,
  },
  {
    id: "f-hub-tactile",
    placeId: HUB_PLACE.id,
    elementId: "hub-west",
    featureType: "tactile_wayfinding",
    value: true,
    sourceType: "trained_mapper",
    observedAt: RECENT,
    evidenceIds: ["ev-hub-west-level"],
    confidence: 0.8,
    disputed: false,
  },
  {
    id: "f-hub-toilet",
    placeId: HUB_PLACE.id,
    elementId: "hub-toilet",
    featureType: "accessible_toilet",
    value: true,
    sourceType: "trained_mapper",
    observedAt: RECENT,
    evidenceIds: ["ev-hub-toilet"],
    confidence: 0.82,
    disputed: false,
  },
  {
    id: "f-hub-quiet",
    placeId: HUB_PLACE.id,
    elementId: "hub-quiet",
    featureType: "quiet_waiting_area",
    value: true,
    sourceType: "venue_attestation",
    observedAt: RECENT,
    evidenceIds: ["ev-hub-quiet"],
    confidence: 0.75,
    disputed: false,
  },
  {
    id: "f-hub-glare",
    placeId: HUB_PLACE.id,
    elementId: "hub-quiet",
    featureType: "low_glare_lighting",
    value: true,
    sourceType: "community_report",
    observedAt: OUTDATED,
    evidenceIds: ["ev-hub-glare"],
    confidence: 0.4,
    disputed: false,
  },
  {
    id: "f-hub-staff",
    placeId: HUB_PLACE.id,
    elementId: "hub-reception",
    featureType: "staff_assistance",
    value: true,
    sourceType: "venue_attestation",
    observedAt: RECENT,
    evidenceIds: ["ev-hub-quiet"],
    confidence: 0.75,
    disputed: false,
  },
  {
    id: "f-hub-plain",
    placeId: HUB_PLACE.id,
    elementId: "hub-reception",
    featureType: "plain_language_instructions",
    value: true,
    sourceType: "venue_attestation",
    observedAt: RECENT,
    evidenceIds: ["ev-hub-quiet"],
    confidence: 0.75,
    disputed: false,
  },
  {
    id: "f-hub-corridor",
    placeId: HUB_PLACE.id,
    elementId: "hub-meeting",
    featureType: "corridor_width_mm",
    value: 1200,
    unit: "mm",
    sourceType: "qualified_assessor",
    observedAt: RECENT,
    evidenceIds: ["ev-hub-lift"],
    confidence: 0.95,
    disputed: false,
  },
];

const hubNodes: RouteNode[] = [
  { id: "n-hub-drop", placeId: HUB_PLACE.id, elementId: "hub-drop", label: "Drop-off", level: "G", nodeType: "drop_off" },
  { id: "n-hub-east", placeId: HUB_PLACE.id, elementId: "hub-east", label: "Entrance East", level: "G", nodeType: "entrance" },
  { id: "n-hub-west", placeId: HUB_PLACE.id, elementId: "hub-west", label: "Entrance West", level: "G", nodeType: "entrance" },
  { id: "n-hub-rec", placeId: HUB_PLACE.id, elementId: "hub-reception", label: "Reception", level: "G", nodeType: "reception" },
  { id: "n-hub-lift-g", placeId: HUB_PLACE.id, elementId: "hub-lift", label: "Lift (ground)", level: "G", nodeType: "lift" },
  { id: "n-hub-lift-2", placeId: HUB_PLACE.id, elementId: "hub-lift", label: "Lift (level 2)", level: "2", nodeType: "lift" },
  { id: "n-hub-meeting", placeId: HUB_PLACE.id, elementId: "hub-meeting", label: "Meeting Room 2.1", level: "2", nodeType: "room" },
  { id: "n-hub-quiet", placeId: HUB_PLACE.id, elementId: "hub-quiet", label: "Quiet room", level: "G", nodeType: "quiet_space" },
];

const hubEdges: RouteEdge[] = [
  {
    id: "e-hub-drop-west",
    fromNodeId: "n-hub-drop",
    toNodeId: "n-hub-west",
    distanceMetres: 25,
    widthMm: 1500,
    steps: 0,
    temporaryBarrier: false,
    evidenceConfidence: 0.9,
  },
  {
    id: "e-hub-east-rec",
    fromNodeId: "n-hub-east",
    toNodeId: "n-hub-rec",
    distanceMetres: 15,
    widthMm: 1000,
    steps: 3,
    temporaryBarrier: false,
    evidenceConfidence: 0.95,
  },
  {
    id: "e-hub-west-rec",
    fromNodeId: "n-hub-west",
    toNodeId: "n-hub-rec",
    distanceMetres: 18,
    widthMm: 920,
    steps: 0,
    automaticDoor: true,
    temporaryBarrier: false,
    evidenceConfidence: 0.7,
  },
  {
    id: "e-hub-rec-quiet",
    fromNodeId: "n-hub-rec",
    toNodeId: "n-hub-quiet",
    distanceMetres: 20,
    widthMm: 1100,
    steps: 0,
    noiseLevel: "low",
    temporaryBarrier: false,
    evidenceConfidence: 0.75,
  },
  {
    id: "e-hub-rec-lift",
    fromNodeId: "n-hub-rec",
    toNodeId: "n-hub-lift-g",
    distanceMetres: 12,
    widthMm: 1200,
    steps: 0,
    temporaryBarrier: false,
    evidenceConfidence: 0.9,
  },
  {
    id: "e-hub-lift",
    fromNodeId: "n-hub-lift-g",
    toNodeId: "n-hub-lift-2",
    distanceMetres: 5,
    widthMm: 880,
    steps: 0,
    liftAvailable: true,
    temporaryBarrier: false,
    evidenceConfidence: 0.95,
  },
  {
    id: "e-hub-lift-meeting",
    fromNodeId: "n-hub-lift-2",
    toNodeId: "n-hub-meeting",
    distanceMetres: 22,
    widthMm: 1200,
    steps: 0,
    temporaryBarrier: false,
    evidenceConfidence: 0.9,
  },
];

export const DEMO_GRAPHS: AccessGraph[] = [
  harbourGraph,
  {
    place: RCH_PLACE,
    elements: rchElements,
    features: rchFeatures,
    evidence: rchEvidence,
    nodes: rchNodes,
    edges: rchEdges,
  },
  {
    place: NSL_PLACE,
    elements: nslElements,
    features: nslFeatures,
    evidence: nslEvidence,
    nodes: nslNodes,
    edges: nslEdges,
  },
  {
    place: HUB_PLACE,
    elements: hubElements,
    features: hubFeatures,
    evidence: hubEvidence,
    nodes: hubNodes,
    edges: hubEdges,
  },
];

/** Scripted demonstration scenarios (fictional). */
export const DEMO_SCENARIOS = [
  {
    id: "scenario-power-chair",
    title: "Power-chair meeting on level two",
    passportId: "passport-power-chair",
    placeId: HUB_PLACE.id,
    destination: "Meeting Room 2.1",
    prompt:
      "I use a power chair. Can I attend a meeting in Room 2.1 at MapAble Community Hub tomorrow morning?",
    expectedStatuses: ["suitable", "suitable_with_conditions", "unknown", "blocked"] as const,
  },
  {
    id: "scenario-sensory",
    title: "Low-noise arrival and quiet waiting",
    passportId: "passport-sensory",
    placeId: HUB_PLACE.id,
    destination: "Quiet room",
    prompt:
      "I need a quiet arrival path, quiet waiting space, low-glare lighting, and plain-language instructions at MapAble Community Hub.",
    expectedStatuses: ["suitable", "suitable_with_conditions", "unknown"] as const,
  },
  {
    id: "scenario-vision",
    title: "Tactile and audible wayfinding",
    passportId: "passport-vision",
    placeId: HUB_PLACE.id,
    destination: "Reception",
    prompt:
      "I need tactile wayfinding, audible lift announcements, and staff assistance at reception at MapAble Community Hub.",
    expectedStatuses: ["suitable", "suitable_with_conditions", "unknown"] as const,
  },
] as const;

export const DEMO_PLACES = DEMO_GRAPHS.map((g) => g.place);

export function getDemoGraph(placeId: string): AccessGraph | undefined {
  return DEMO_GRAPHS.find((g) => g.place.id === placeId);
}

export function findDemoDestinationNode(
  placeId: string,
  destinationQuery: string,
): RouteNode | undefined {
  const graph = getDemoGraph(placeId);
  if (!graph) return undefined;
  const q = destinationQuery.toLowerCase();
  return graph.nodes.find(
    (n) =>
      n.label.toLowerCase().includes(q) ||
      q.includes(n.label.toLowerCase()) ||
      (q.includes("3.12") && n.label.includes("3.12")) ||
      (q.includes("2.04") && n.label.includes("2.04")) ||
      (q.includes("2.1") && n.label.includes("2.1")),
  );
}

export function findDemoEntranceNodes(placeId: string): RouteNode[] {
  const graph = getDemoGraph(placeId);
  if (!graph) return [];
  return graph.nodes.filter((n) => n.nodeType === "entrance");
}
