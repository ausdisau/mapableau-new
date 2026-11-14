import type { AccessFeature, Place } from "./domain";

/**
 * Evidence Lens: a deterministic, privacy-preserving pre-visit planning aid.
 *
 * Selected needs are transient UI state. No diagnosis, GPS, personal profile,
 * attendance record, ranking, accessibility score or model prediction.
 * A source describing a feature is NOT proof it will work for any individual.
 */
export type AccessCheckKey =
  | "stepFree"
  | "accessibleToilet"
  | "communication"
  | "sensory"
  | "transport";

export type AccessCheckSelection = Readonly<Record<AccessCheckKey, boolean>>;

export const DEFAULT_ACCESS_CHECKS: AccessCheckSelection = {
  stepFree: true,
  accessibleToilet: true,
  communication: false,
  sensory: false,
  transport: false,
};

export type EvidenceFinding = "source-described" | "conditional" | "not-assessed";

export type AccessCheckResult = {
  key: AccessCheckKey;
  label: string;
  finding: EvidenceFinding;
  evidence: string;
  question: string;
  provenance: string;
};

type AccessCheckDefinition = {
  label: string;
  question: string;
  /** The directory doesn't supply evidence for these fields yet. */
  field?: "stepFree" | "accessibleToilet";
};

export const ACCESS_CHECKS: Readonly<Record<AccessCheckKey, AccessCheckDefinition>> = {
  stepFree: {
    label: "Step-free arrival and entrance",
    field: "stepFree",
    question: "Which step-free entrance and internal route should I use? Are lifts and ramps working on the day?",
  },
  accessibleToilet: {
    label: "Accessible toilets",
    field: "accessibleToilet",
    question: "Where is the accessible toilet? Is it available during opening hours, and what are its access features and limitations?",
  },
  communication: {
    label: "Communication access",
    question: "Can staff offer written information, communication support and extra time to communicate if requested?",
  },
  sensory: {
    label: "Quiet areas and sensory conditions",
    question: "Are there quiet areas, seating and options to reduce noise or crowds?",
  },
  transport: {
    label: "Step-free arrival from transport",
    question: "What is the step-free route from an accessible transport stop or drop-off point to the correct entrance? Are there known barriers?",
  },
};

const ALL_KEYS: AccessCheckKey[] = [
  "stepFree",
  "accessibleToilet",
  "communication",
  "sensory",
  "transport",
];

function findingFor(feature: AccessFeature | undefined): EvidenceFinding {
  if (!feature) return "not-assessed";
  if (feature.status === "documented") return "source-described";
  if (feature.status === "conditional") return "conditional";
  return "not-assessed";
}

function evidenceFor(
  key: AccessCheckKey,
  feature: AccessFeature | undefined,
): string {
  if (!feature || feature.status === "unknown") {
    return key === "transport"
      ? "No journey-specific transport or route assessment is available in this place record."
      : "This place record does not establish this feature. No conclusion about suitability is possible.";
  }
  const explanation = feature.detail?.trim() || "Source details were not supplied.";
  return feature.status === "documented"
    ? "Published source describes the feature, without an independent suitability guarantee: " + explanation
    : "Published information reports conditions or limitations requiring confirmation: " + explanation;
}

export function evaluatePlaceEvidence(
  place: Place,
  selection: AccessCheckSelection,
): AccessCheckResult[] {
  const provenance = place.sourceLabel +
    (place.sourceReviewedAt ? " · checked/retrieved " + place.sourceReviewedAt : " · source date unknown");
  return ALL_KEYS.filter((key) => selection[key]).map((key) => {
    const definition = ACCESS_CHECKS[key];
    const feature = definition.field ? place[definition.field] : undefined;
    return {
      key,
      label: definition.label,
      finding: findingFor(feature),
      evidence: evidenceFor(key, feature),
      question: definition.question,
      provenance: definition.field ? provenance : "No feature-level evidence in this directory entry",
    };
  });
}

/** A shareable draft contains questions only — never selected personal needs. */
export function makeVenueQuestionsDraft(
  place: Place,
  results: AccessCheckResult[],
  context?: { gatheringName?: string },
): string {
  if (results.length === 0) return "";
  const safeName = place.name.replace(/[\r\n\t]+/g, " ").trim();
  const gathering = context?.gatheringName
    ? " for a possible community gathering"
    : "";
  return [
    "Hello,",
    "",
    "I'm considering visiting " + safeName + gathering + ".",
    "Could you help me confirm the following practical access arrangements?",
    "",
    ...results.map((result, index) => (index + 1) + ". " + result.question),
    "",
    "If any feature is unavailable or conditional, could you describe an alternative?",
    "Thank you.",
    "",
    "Draft only. Please review before sending. No date, diagnosis, GPS location or check-in is included.",
  ].join("\n");
}

/** A planning reminder, not an RSVP or verification of a real event. */
export function makeCommunityReadiness(
  gatheringName: string,
  place: Place,
  results: AccessCheckResult[],
): string[] {
  return [
    "This is a proposed activity, not a scheduled or confirmed CripSquare event.",
    "Ask the venue about " + (results.length ? results.map((item) => item.label.toLowerCase()).join(", ") : "the relevant access arrangements") + ".",
    "Check the whole travel route, operating hours and accessible alternatives.",
    "Give people an accessible way to ask questions without publicly disclosing their disability or attendance.",
    "Only invite people after a human organiser confirms the arrangements and a backup plan.",
    "Venue: " + place.name + ". Activity: " + gatheringName + ".",
  ];
}
