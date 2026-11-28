/**
 * Read-only OpenStreetMap accessibility-tag bridge for MapAble Access.
 * OSM map tags are third-party assertions, NOT measured access evidence.
 * This module does no network requests, account actions, or data writes.
 */

export type OsmElementKind = "node" | "way" | "relation";

export type OsmElementInput = {
  type: OsmElementKind;
  id: number;
  version?: number | null;
  timestamp?: string | null;
  tags: Readonly<Record<string, unknown>>;
};

const ACCESS_TAG_LABELS = {
  wheelchair: "Wheelchair access tag",
  "ramp:wheelchair": "Wheelchair ramp tag",
  ramp: "Ramp tag",
  kerb: "Kerb profile",
  surface: "Pathway surface",
  smoothness: "Surface smoothness",
  incline: "Incline",
  width: "Path width",
  "door:width": "Doorway width",
  tactile_paving: "Tactile paving",
  "toilets:wheelchair": "Toilet access",
  step_count: "Step count",
  handrail: "Handrail",
  crossing: "Crossing",
  highway: "Path type",
  footway: "Footway",
  sidewalk: "Footpath",
  entrance: "Entrance",
  lift: "Lift",
  elevator: "Lift",
  lit: "Lighting",
} as const;

export type OsmAccessTagKey = keyof typeof ACCESS_TAG_LABELS;

export type OsmAccessTagCandidate = {
  key: OsmAccessTagKey;
  label: string;
  rawValue: string;
  evidenceState: "unverified_external_tag";
};

export type OsmAccessCandidate = {
  source: "openstreetmap";
  sourceElement: { type: OsmElementKind; id: number; version: number | null };
  sourceUrl: string;
  sourceLastEditedAt: string | null;
  observedAt: null;
  sourceLicence: "ODbL-1.0";
  attribution: "© OpenStreetMap contributors";
  attributionUrl: "https://www.openstreetmap.org/copyright";
  evidenceState: "unverified_external_tag";
  verificationState: "not_assessed";
  participantSpecificFit: "not_assessed";
  routeSafety: "not_assessed";
  sourceTags: OsmAccessTagCandidate[];
  requiresHumanReview: true;
  autoPublishesToOsm: false;
  autoPublishesToMapAble: false;
};

function safeTimestamp(value: string | null | undefined): string | null {
  if (typeof value !== "string" || value.length > 45) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function normaliseOsmAccessCandidate(
  input: OsmElementInput,
): OsmAccessCandidate {
  if (!["node", "way", "relation"].includes(input.type)) {
    throw new Error("Invalid OSM element kind");
  }
  if (!Number.isSafeInteger(input.id) || input.id <= 0) {
    throw new Error("Invalid OSM element identifier");
  }
  const sourceTags: OsmAccessTagCandidate[] = [];
  for (const key of Object.keys(ACCESS_TAG_LABELS) as OsmAccessTagKey[]) {
    if (!Object.prototype.hasOwnProperty.call(input.tags ?? {}, key)) continue;
    const rawValue = input.tags[key];
    if (typeof rawValue !== "string") continue;
    const value = rawValue.trim();
    if (value.length === 0 || value.length > 80) continue;
    sourceTags.push({
      key,
      label: ACCESS_TAG_LABELS[key],
      rawValue: value,
      evidenceState: "unverified_external_tag",
    });
  }
  return {
    source: "openstreetmap",
    sourceElement: {
      type: input.type,
      id: input.id,
      version:
        typeof input.version === "number" &&
        Number.isSafeInteger(input.version) && input.version > 0
          ? input.version
          : null,
    },
    sourceUrl:
      "https://www.openstreetmap.org/" + input.type + "/" + input.id,
    sourceLastEditedAt: safeTimestamp(input.timestamp),
    observedAt: null,
    sourceLicence: "ODbL-1.0",
    attribution: "© OpenStreetMap contributors",
    attributionUrl: "https://www.openstreetmap.org/copyright",
    evidenceState: "unverified_external_tag",
    verificationState: "not_assessed",
    participantSpecificFit: "not_assessed",
    routeSafety: "not_assessed",
    sourceTags,
    requiresHumanReview: true,
    autoPublishesToOsm: false,
    autoPublishesToMapAble: false,
  };
}

export type OsmSurveyQuestion = {
  id: string;
  focusTag: OsmAccessTagKey;
  question: string;
  relatedElementUrl: string;
  publicEdit: "requires_separate_consent_and_osm_review";
  autoWrite: false;
};

export function proposeOsmSurveyQuestions(
  candidate: OsmAccessCandidate,
): OsmSurveyQuestion[] {
  const tags = new Map(candidate.sourceTags.map((tag) => [tag.key, tag.rawValue]));
  const context = tags.get("highway");
  const crossing = context === "crossing" || tags.get("footway") === "crossing";
  const path = ["footway", "path", "pedestrian"].includes(context ?? "");
  const entrance = tags.has("entrance");

  const questions: Array<{key: OsmAccessTagKey; question: string}> = [];
  if (crossing) {
    questions.push({ key: "kerb", question: "What is the kerb profile at this crossing?" });
    questions.push({ key: "tactile_paving", question: "Is tactile paving present?" });
  }
  if (path) {
    questions.push({ key: "surface", question: "What is the pathway surface?" });
    questions.push({ key: "incline", question: "Has the gradient been measured?" });
  }
  if (entrance) {
    questions.push({ key: "step_count", question: "How many entrance steps are present?" });
    questions.push({ key: "door:width", question: "Has the door opening been measured?" });
  }

  return questions.filter((item) => !tags.has(item.key)).map((item) => ({
    id: candidate.sourceElement.type + "-" + candidate.sourceElement.id + "-" + item.key,
    focusTag: item.key,
    question: item.question + " You may choose unknown or skip.",
    relatedElementUrl: candidate.sourceUrl,
    publicEdit: "requires_separate_consent_and_osm_review" as const,
    autoWrite: false as const,
  }));
}
