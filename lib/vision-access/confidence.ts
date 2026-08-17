/**
 * Multi-dimensional confidence — never a single universal score.
 */

export type VisionConfidenceDimensions = {
  modelDetection: number | null;
  classification: number | null;
  segmentation: number | null;
  depth: number | null;
  geometry: number | null;
  frameQuality: number | null;
  temporalConsistency: number | null;
  deviceCapability: number | null;
  environmentalSuitability: number | null;
  sourceCredibility: number | null;
  corroboration: number | null;
  freshness: number | null;
  /** Moderation is categorical, not numeric — mirrored for display state. */
  moderationState:
    | "none"
    | "pending"
    | "accepted_as_observation"
    | "corroborated"
    | "verified"
    | "rejected";
};

export const VISION_PARTICIPANT_STATES = [
  "possible",
  "likely_candidate",
  "measurement_unavailable",
  "provisional_estimate",
  "confirmed_by_you",
  "corroborated",
  "reviewed",
  "verified_by_assessor",
  "unknown",
] as const;

export type VisionParticipantFacingState =
  (typeof VISION_PARTICIPANT_STATES)[number];

export const VISION_PARTICIPANT_STATE_LABELS: Record<
  VisionParticipantFacingState,
  string
> = {
  possible: "Possible",
  likely_candidate: "Likely candidate",
  measurement_unavailable: "Measurement unavailable",
  provisional_estimate: "Provisional estimate",
  confirmed_by_you: "Confirmed by you",
  corroborated: "Corroborated",
  reviewed: "Reviewed",
  verified_by_assessor: "Verified by assessor",
  unknown: "Unknown",
};

export function emptyConfidenceDimensions(): VisionConfidenceDimensions {
  return {
    modelDetection: null,
    classification: null,
    segmentation: null,
    depth: null,
    geometry: null,
    frameQuality: null,
    temporalConsistency: null,
    deviceCapability: null,
    environmentalSuitability: null,
    sourceCredibility: null,
    corroboration: null,
    freshness: null,
    moderationState: "none",
  };
}

/** Synthetic fixtures may set detection/classification only — never imply verification. */
export function participantStateFromFixture(input: {
  detectionConfidence: number | null;
  participantConfirmed?: boolean;
}): VisionParticipantFacingState {
  if (input.participantConfirmed) return "confirmed_by_you";
  if (input.detectionConfidence == null) return "unknown";
  if (input.detectionConfidence < 0.4) return "possible";
  if (input.detectionConfidence < 0.75) return "likely_candidate";
  return "likely_candidate";
}
