/**
 * Synthetic St Ives Search demo fixtures.
 * Every clinic, dimension, route and check is fictional.
 * Do not mix with public discovery results from GET /api/mapable-search.
 */

export const ST_IVES_DEMO_SOURCE =
  "Simulated site audit · 9 November 2026" as const;

export const ST_IVES_DEMO_DISCLOSURE =
  "Demo · All providers, measurements and checks are synthetic." as const;

export const DEFAULT_DOORWAY_MINIMUM_MM = 900;

export type DemoClinicId =
  | "demo-clinic-st-ives-allied-health"
  | "demo-clinic-kuringgai-rehab";

export type DoorMatchStatus = "meets" | "below" | "unknown";

export type QuietRoomStatus = "listed" | "unavailable" | "unknown";

export type DemoClinic = {
  id: DemoClinicId;
  name: string;
  shortLabel: string;
  suburb: string;
  service: string;
  entranceWidthMm: number | null;
  ceilingHoist: "listed" | "unavailable" | "unknown";
  quietRoom: QuietRoomStatus;
  busApproachMetres: number;
  busApproachSummary: string;
  busGradientKnown: boolean;
  hasFloorPlan: boolean;
  map: { x: number; y: number };
  pinNumber: 1 | 2;
};

export type DemoFloorPlanFeature = {
  id: string;
  label: string;
  description: string;
  x: number;
  y: number;
};

export type DemoFloorPlan = {
  clinicId: DemoClinicId;
  title: string;
  altText: string;
  features: DemoFloorPlanFeature[];
};

export type ComparisonRow = {
  id: string;
  criterion: string;
  clinic1: string;
  clinic1Detail: string;
  clinic2: string;
  clinic2Detail: string;
};

export const ST_IVES_DEMO_CLINICS: readonly DemoClinic[] = [
  {
    id: "demo-clinic-st-ives-allied-health",
    name: "St Ives Allied Health Hub",
    shortLabel: "Demo clinic 1",
    suburb: "St Ives",
    service: "Physio",
    entranceWidthMm: 920,
    ceilingHoist: "listed",
    quietRoom: "listed",
    busApproachMetres: 120,
    busApproachSummary: "120 m · Step-free in demo",
    busGradientKnown: true,
    hasFloorPlan: true,
    map: { x: 42, y: 48 },
    pinNumber: 1,
  },
  {
    id: "demo-clinic-kuringgai-rehab",
    name: "Ku-ring-gai Rehab Clinic",
    shortLabel: "Demo clinic 2",
    suburb: "St Ives",
    service: "Physio",
    entranceWidthMm: 870,
    ceilingHoist: "listed",
    quietRoom: "unavailable",
    busApproachMetres: 240,
    busApproachSummary: "240 m · One kerb ramp · gradient unknown",
    busGradientKnown: false,
    hasFloorPlan: false,
    map: { x: 68, y: 36 },
    pinNumber: 2,
  },
] as const;

export const ST_IVES_FLOOR_PLAN: DemoFloorPlan = {
  clinicId: "demo-clinic-st-ives-allied-health",
  title: "Inside clinic 1",
  altText:
    "Illustrative interior preview of demo clinic 1 with labelled Entrance, Ceiling hoist and Quiet room. Not a verified accessibility survey.",
  features: [
    {
      id: "entrance",
      label: "Entrance",
      description: "920 mm doorway in this synthetic demo.",
      x: 18,
      y: 72,
    },
    {
      id: "ceiling-hoist",
      label: "Ceiling hoist",
      description:
        "Ceiling hoist listed over a treatment bay in this demo plan.",
      x: 58,
      y: 42,
    },
    {
      id: "quiet-room",
      label: "Quiet room",
      description: "Quiet room listed as available in this demo plan.",
      x: 78,
      y: 28,
    },
  ],
};

/** Bus stop → clinic 1 path as percentage points for the SVG atlas. */
export const ST_IVES_TRANSIT_PATH: ReadonlyArray<{ x: number; y: number }> = [
  { x: 22, y: 62 },
  { x: 30, y: 56 },
  { x: 36, y: 52 },
  { x: 42, y: 48 },
];

export const ST_IVES_BUS_STOP = { x: 22, y: 62, label: "Bus stop (demo)" };

export const ALTERNATIVE_ROUTE_NOTICE =
  "This route includes a 1:10 ramp. Review the route details." as const;

export const AAC_PHRASES = [
  {
    id: "clinic",
    label: "Find a clinic",
    insert:
      "Find a physio near St Ives with a ceiling hoist and step-free bus access.",
  },
  {
    id: "trip",
    label: "Step-free trip",
    insert: "Plan a step-free trip from a bus stop to the clinic entrance.",
  },
  {
    id: "jobs",
    label: "Employment information",
    insert: "Show employment information and inclusive job pathways.",
  },
  {
    id: "community",
    label: "Community",
    insert: "Find community activities near St Ives.",
  },
] as const;

export const DEMO_USER_MESSAGE =
  "Find a physio near St Ives with a ceiling hoist and step-free bus access.";

export function getClinicById(id: DemoClinicId): DemoClinic {
  const clinic = ST_IVES_DEMO_CLINICS.find((item) => item.id === id);
  if (!clinic) {
    throw new Error(`Unknown demo clinic: ${id}`);
  }
  return clinic;
}

export function evaluateAgainstDoorMinimum(
  entranceWidthMm: number | null,
  minimumMm: number,
): DoorMatchStatus {
  if (entranceWidthMm == null || !Number.isFinite(entranceWidthMm)) {
    return "unknown";
  }
  return entranceWidthMm >= minimumMm ? "meets" : "below";
}

export function summariseDemoMatches(minimumMm: number): {
  matches: DemoClinic[];
  alternatives: DemoClinic[];
  matchCount: number;
  alternativeCount: number;
  summary: string;
} {
  const matches: DemoClinic[] = [];
  const alternatives: DemoClinic[] = [];
  for (const clinic of ST_IVES_DEMO_CLINICS) {
    const status = evaluateAgainstDoorMinimum(
      clinic.entranceWidthMm,
      minimumMm,
    );
    if (status === "meets") matches.push(clinic);
    else alternatives.push(clinic);
  }
  const matchCount = matches.length;
  const alternativeCount = alternatives.length;
  const summary =
    matchCount === 0
      ? `${alternativeCount} alternative${alternativeCount === 1 ? "" : "s"} below minimum`
      : `${matchCount} match${matchCount === 1 ? "" : "es"} · ${alternativeCount} alternative${
          alternativeCount === 1 ? "" : "s"
        } below minimum`;
  return { matches, alternatives, matchCount, alternativeCount, summary };
}

export function doorComparisonLabel(
  clinic: DemoClinic,
  minimumMm: number,
): { primary: string; detail: string } {
  const width = clinic.entranceWidthMm;
  if (width == null) {
    return { primary: "Unknown", detail: "Entrance width not recorded" };
  }
  const status = evaluateAgainstDoorMinimum(width, minimumMm);
  const delta = Math.abs(width - minimumMm);
  if (status === "meets") {
    return {
      primary: `${width} mm`,
      detail: `Meets minimum · ${delta} mm above`,
    };
  }
  return {
    primary: `${width} mm`,
    detail: `Below minimum · ${delta} mm below`,
  };
}

export function buildComparisonRows(minimumMm: number): ComparisonRow[] {
  const [clinic1, clinic2] = ST_IVES_DEMO_CLINICS;
  const door1 = doorComparisonLabel(clinic1, minimumMm);
  const door2 = doorComparisonLabel(clinic2, minimumMm);
  return [
    {
      id: "entrance",
      criterion: "Entrance width",
      clinic1: door1.primary,
      clinic1Detail: door1.detail,
      clinic2: door2.primary,
      clinic2Detail: door2.detail,
    },
    {
      id: "hoist",
      criterion: "Ceiling hoist",
      clinic1: "Listed",
      clinic1Detail: "Listed in synthetic demo",
      clinic2: "Listed",
      clinic2Detail: "Listed in synthetic demo",
    },
    {
      id: "quiet",
      criterion: "Quiet room",
      clinic1: "Listed",
      clinic1Detail: "Listed in synthetic demo",
      clinic2: "Unavailable",
      clinic2Detail: "Known absence in synthetic demo",
    },
    {
      id: "bus",
      criterion: "Bus approach",
      clinic1: "120 m",
      clinic1Detail: "Step-free in demo",
      clinic2: "240 m",
      clinic2Detail: clinic2.busGradientKnown
        ? "One kerb ramp"
        : "One kerb ramp · gradient unknown",
    },
  ];
}

export function assistantSummaryForMinimum(minimumMm: number): string {
  const { matches, alternatives, matchCount } = summariseDemoMatches(minimumMm);
  if (matchCount === 0) {
    return `Both demo clinics are below your ${minimumMm} mm doorway minimum. Review the comparison and decide what still works for you.`;
  }
  const match = matches[0];
  const alt = alternatives[0];
  const matchDelta = (match.entranceWidthMm ?? 0) - minimumMm;
  const altDelta = minimumMm - (alt?.entranceWidthMm ?? 0);
  return `One demo clinic meets your ${minimumMm} mm doorway minimum (${matchDelta} mm above). The other is ${altDelta} mm below it. Its kerb ramp gradient is unknown.`;
}

export function whyTheseResults(minimumMm: number): string {
  const [clinic1, clinic2] = ST_IVES_DEMO_CLINICS;
  const d1 = (clinic1.entranceWidthMm ?? 0) - minimumMm;
  const d2 = minimumMm - (clinic2.entranceWidthMm ?? 0);
  return `Clinic 1 is ${Math.abs(d1)} mm ${d1 >= 0 ? "above" : "below"} your doorway minimum. Clinic 2 is ${Math.abs(d2)} mm ${d2 >= 0 ? "below" : "above"} it. Evidence comes from a ${ST_IVES_DEMO_SOURCE}. Clinic 2’s kerb ramp gradient is unknown.`;
}

/** Populated St Ives fixtures — not the empty public landing. */
export function shouldPopulateStIvesDemo(options: {
  demoParam?: string | null;
  presentation?: string | null;
  query?: string | null;
}): boolean {
  if (options.demoParam === "st-ives") return true;
  if (options.presentation !== "conversation") return false;
  const q = (options.query ?? "").toLowerCase();
  return (
    q.includes("st ives") ||
    (q.includes("physio") && q.includes("hoist")) ||
    q.includes("ceiling hoist")
  );
}
