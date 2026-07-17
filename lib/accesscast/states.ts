/**
 * Participant-facing Access Weather (AccessCast) forecast states.
 * Never display a state by colour alone — always pair with text and plain language.
 */

export type AccessCastState =
  | "stable"
  | "likely_usable"
  | "fragile"
  | "degraded"
  | "temporarily_unavailable"
  | "cannot_confirm"
  | "conflicting"
  | "stale"
  | "unknown";

export const ACCESS_CAST_STATES: AccessCastState[] = [
  "stable",
  "likely_usable",
  "fragile",
  "degraded",
  "temporarily_unavailable",
  "cannot_confirm",
  "conflicting",
  "stale",
  "unknown",
];

export const ACCESS_CAST_STATE_PLAIN_LANGUAGE: Record<AccessCastState, string> = {
  stable:
    "All known hard requirements are supported by sufficiently current evidence, with no identified active disruptions.",
  likely_usable:
    "Evidence supports the journey, but one or more non-critical uncertainties remain.",
  fragile:
    "The journey currently depends on one or more single points of failure without a verified fallback.",
  degraded:
    "The journey remains possible but involves additional burden, delay, distance, assistance or workaround.",
  temporarily_unavailable: "A known current condition blocks a hard requirement.",
  cannot_confirm: "Required evidence or service confirmation is missing.",
  conflicting: "Current sources disagree.",
  stale: "The relevant evidence has exceeded its feature-specific freshness period.",
  unknown: "Insufficient information exists to evaluate the journey.",
};

/** Severity rank — higher means worse for whole-journey aggregation. */
export const ACCESS_CAST_STATE_RANK: Record<AccessCastState, number> = {
  stable: 0,
  likely_usable: 1,
  degraded: 2,
  fragile: 3,
  stale: 4,
  cannot_confirm: 5,
  conflicting: 6,
  unknown: 7,
  temporarily_unavailable: 8,
};

export function worseAccessCastState(a: AccessCastState, b: AccessCastState): AccessCastState {
  return ACCESS_CAST_STATE_RANK[a] >= ACCESS_CAST_STATE_RANK[b] ? a : b;
}
