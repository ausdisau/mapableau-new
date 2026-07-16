/**
 * Candidate lifecycle state machine.
 * Forbidden: detected → verified; model confidence → public incident.
 */

export const VISION_CANDIDATE_STATES = [
  "detected",
  "tracked",
  "low_confidence",
  "participant_review",
  "participant_confirmed",
  "participant_rejected",
  "submitted",
  "moderation_pending",
  "corroborated",
  "verified",
  "disputed",
  "superseded",
  "expired",
  "deleted",
] as const;

export type VisionCandidateState = (typeof VISION_CANDIDATE_STATES)[number];

const ALLOWED_TRANSITIONS: Record<
  VisionCandidateState,
  readonly VisionCandidateState[]
> = {
  detected: ["tracked", "low_confidence", "participant_review", "expired", "deleted"],
  tracked: ["low_confidence", "participant_review", "expired", "deleted"],
  low_confidence: ["tracked", "participant_review", "expired", "deleted"],
  participant_review: [
    "participant_confirmed",
    "participant_rejected",
    "expired",
    "deleted",
  ],
  participant_confirmed: ["submitted", "expired", "deleted"],
  participant_rejected: ["deleted", "expired"],
  submitted: ["moderation_pending", "expired", "deleted"],
  moderation_pending: [
    "corroborated",
    "verified",
    "disputed",
    "participant_review",
    "expired",
    "deleted",
  ],
  corroborated: ["verified", "disputed", "superseded", "expired", "deleted"],
  verified: ["disputed", "superseded", "expired", "deleted"],
  disputed: ["moderation_pending", "superseded", "expired", "deleted"],
  superseded: ["deleted"],
  expired: ["deleted"],
  deleted: [],
};

export function canTransitionCandidate(
  from: VisionCandidateState,
  to: VisionCandidateState,
): boolean {
  if (from === to) return false;
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function assertCandidateTransition(
  from: VisionCandidateState,
  to: VisionCandidateState,
): void {
  if (!canTransitionCandidate(from, to)) {
    throw new Error(`VISION_CANDIDATE_TRANSITION_FORBIDDEN:${from}->${to}`);
  }
}

export function transitionCandidate(
  from: VisionCandidateState,
  to: VisionCandidateState,
): VisionCandidateState {
  assertCandidateTransition(from, to);
  return to;
}

/** Hard safety: never allow silent elevation to verified from early states. */
export function isForbiddenElevation(
  from: VisionCandidateState,
  to: VisionCandidateState,
): boolean {
  if (to === "verified" && (from === "detected" || from === "tracked" || from === "low_confidence")) {
    return true;
  }
  return !canTransitionCandidate(from, to) && to === "verified";
}

export function nextStates(from: VisionCandidateState): readonly VisionCandidateState[] {
  return ALLOWED_TRANSITIONS[from];
}
