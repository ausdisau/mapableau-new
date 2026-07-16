export type PlatformIntelligenceDomainId =
  | "care"
  | "transport"
  | "employment"
  | "foods"
  | "rehabilitation";

export interface PlatformIntelligenceDomain {
  id: PlatformIntelligenceDomainId;
  name: string;
  shortName: string;
  status: "synthetic_live" | "design_ready";
  statusLabel: string;
  moduleHref: string;
  purpose: string;
  scenarioCount: number;
  capabilities: string[];
  hardBoundaries: string[];
  connectedDomains: string[];
  firstVerticalSlice: string;
  documentationPath: string;
}

export interface PlatformJourneyGraph {
  id: "workday" | "daily_living";
  name: string;
  status: "design_ready";
  scenarioCount: number;
  domains: string[];
  outcome: string;
  stopBoundary: string;
}

const DOMAINS: PlatformIntelligenceDomain[] = [
  {
    id: "care",
    name: "Care & Support Intelligence",
    shortName: "Care",
    status: "synthetic_live",
    statusLabel: "Synthetic kernel live",
    moduleHref: "/care",
    purpose:
      "Coordinate linked support and accessible transport inside a revocable participant mandate.",
    scenarioCount: 18,
    capabilities: [
      "Participant world state",
      "Five bounded specialists",
      "Counterfactual recovery planning",
      "Deterministic policy arbitration",
      "Tamper-evident kernel audit",
    ],
    hardBoundaries: [
      "No clinical, funding or restrictive-practice decisions",
      "No provider messaging, booking, payment or emergency execution",
      "Every intent remains non-executable and confirmation-gated",
    ],
    connectedDomains: ["Transport", "Employment", "Foods", "Rehabilitation"],
    firstVerticalSlice:
      "Recover a linked support-worker and accessible-transport journey after disruption.",
    documentationPath: "docs/modules/care-support-intelligence.md",
  },
  {
    id: "transport",
    name: "Transport Intelligence",
    shortName: "Transport",
    status: "design_ready",
    statusLabel: "Design ready",
    moduleHref: "/transport",
    purpose:
      "Plan and coordinate accessible journeys using explicit mobility requirements and confidence-labelled route evidence.",
    scenarioCount: 12,
    capabilities: [
      "Mobility-aid-aware route evidence",
      "Driver and vehicle eligibility",
      "Complete journey simulation",
      "Live disruption recovery",
      "Handover and evidence review",
    ],
    hardBoundaries: [
      "Unknown accessibility never becomes accessible",
      "No automatic dispatch, pooling, cancellation or payment",
      "Location access is limited to an active consented trip",
    ],
    connectedDomains: ["Navigate", "Access", "Care", "Employment"],
    firstVerticalSlice:
      "Coordinate an accessible trip to a job interview with route confidence, support and fallback options.",
    documentationPath: "docs/modules/transport-employment-intelligence.md",
  },
  {
    id: "employment",
    name: "Employment Intelligence",
    shortName: "Employment",
    status: "design_ready",
    statusLabel: "Design ready",
    moduleHref: "/employment",
    purpose:
      "Help participants understand opportunities, prepare applications, control disclosure and coordinate practical work supports.",
    scenarioCount: 12,
    capabilities: [
      "Plain-language opportunity explanation",
      "Participant-defined alignment",
      "Adjustment and disclosure control",
      "Evidence-linked application drafting",
      "Interview-day coordination",
    ],
    hardBoundaries: [
      "No candidate worthiness score or employer-side ranking",
      "No disability inference or automated rejection",
      "No application, adjustment or disclosure submission",
    ],
    connectedDomains: ["Transport", "Navigate", "Access", "Care"],
    firstVerticalSlice:
      "Prepare for an accessible job interview while sharing only participant-approved adjustment information.",
    documentationPath: "docs/modules/transport-employment-intelligence.md",
  },
  {
    id: "foods",
    name: "MapAble Foods Intelligence",
    shortName: "Foods",
    status: "design_ready",
    statusLabel: "Design ready · build next",
    moduleHref: "/foods",
    purpose:
      "Coordinate meals, groceries, preparation support, delivery and transparent cost separation around explicit choices.",
    scenarioCount: 16,
    capabilities: [
      "Ingredient and allergen evidence",
      "Preference alignment after safety filtering",
      "Meal and grocery fulfilment simulation",
      "Support and delivery coordination",
      "Transparent food cost separation",
    ],
    hardBoundaries: [
      "Unknown required allergen data blocks the item",
      "No clinical diet, swallowing or medication advice",
      "No ordering, silent substitution, funding approval, claim or payment",
    ],
    connectedDomains: ["Care", "Rehabilitation", "Employment", "Billing"],
    firstVerticalSlice:
      "Coordinate a synthetic week of safe groceries, meal support and delivery with participant-paid ingredients separated.",
    documentationPath: "docs/modules/foods-rehabilitation-intelligence.md",
  },
  {
    id: "rehabilitation",
    name: "MapAble Moves / Rehabilitation Intelligence",
    shortName: "Rehabilitation",
    status: "design_ready",
    statusLabel: "Design ready",
    moduleHref: "/moves",
    purpose:
      "Coordinate clinician-authored rehabilitation plans, accessible sessions, support, transport and participant-reported progress.",
    scenarioCount: 20,
    capabilities: [
      "Clinician-authorised plan explanation",
      "Practitioner and worker verification",
      "Pre-session operational safety",
      "Accessible telehealth and home-visit coordination",
      "Participant progress drafting for clinician review",
    ],
    hardBoundaries: [
      "No diagnosis, prescription, progression or clinical interpretation",
      "Clinical notes remain in a restricted clinical plane",
      "No appointment, recording, plan update, claim or payment execution",
    ],
    connectedDomains: ["Care", "Transport", "Foods", "Employment"],
    firstVerticalSlice:
      "Coordinate a clinician-authored home or telehealth rehabilitation session without changing treatment.",
    documentationPath: "docs/modules/foods-rehabilitation-intelligence.md",
  },
];

const JOURNEY_GRAPHS: PlatformJourneyGraph[] = [
  {
    id: "workday",
    name: "Workday Intelligence",
    status: "design_ready",
    scenarioCount: 8,
    domains: ["Employment", "Access", "Navigate", "Transport", "Care"],
    outcome:
      "Coordinate the complete day required to pursue and sustain employment.",
    stopBoundary:
      "Participant stop halts every application, disclosure, route, trip and support intent.",
  },
  {
    id: "daily_living",
    name: "Daily Living Intelligence",
    status: "design_ready",
    scenarioCount: 8,
    domains: ["Foods", "Rehabilitation", "Care", "Transport", "Calendar"],
    outcome:
      "Coordinate rehabilitation, support, transport, meals and delivery without crossing clinical or food-safety boundaries.",
    stopBoundary:
      "Participant stop halts every clinical projection, cart, delivery, appointment and support intent.",
  },
];

export function listPlatformIntelligenceDomains() {
  return DOMAINS.map((domain) => ({
    ...domain,
    capabilities: [...domain.capabilities],
    hardBoundaries: [...domain.hardBoundaries],
    connectedDomains: [...domain.connectedDomains],
  }));
}

export function listPlatformJourneyGraphs() {
  return JOURNEY_GRAPHS.map((graph) => ({
    ...graph,
    domains: [...graph.domains],
  }));
}
