/**
 * Release state helpers — merge does not advance maturity/release state.
 */

import type { CapabilityMaturity } from "@/lib/ai/platform/types/maturity";

import { RELEASE_STATES, type ReleaseState } from "./types";

const RELEASE_STATE_SET = new Set<string>(RELEASE_STATES);

export function isReleaseState(value: string): value is ReleaseState {
  return RELEASE_STATE_SET.has(value);
}

/** States that may surface to invited pilot participants (still gated). */
export function isPilotEligibleState(state: ReleaseState): boolean {
  return state === "controlled_pilot" || state === "controlled_pilot_candidate";
}

/** States that may make public production claims (still evidence-gated). */
export function isProductionClaimEligibleState(state: ReleaseState): boolean {
  return state === "production_supported";
}

export function isTerminalReleaseState(state: ReleaseState): boolean {
  return state === "suspended" || state === "retired";
}

/**
 * Informational mapping from capability maturity → suggested release state.
 * Does NOT mutate registry maturity. Code merge never advances either axis.
 */
export function suggestedReleaseStateFromMaturity(
  maturity: CapabilityMaturity
): ReleaseState {
  switch (maturity) {
    case "deterministic":
      return "internal_test";
    case "experimental":
      return "experimental";
    case "synthetic_only":
      return "experimental";
    case "shadow":
      return "internal_test";
    case "controlled_pilot":
      return "controlled_pilot_candidate";
    case "production_supported":
      return "production_supported";
    case "suspended":
      return "suspended";
    case "retired":
      return "retired";
    default: {
      const _exhaustive: never = maturity;
      return _exhaustive;
    }
  }
}

/**
 * Allowed manual transitions for operators (documentation + gate checks).
 * Advancement always requires evidence + human approval outside this module.
 */
export const ALLOWED_RELEASE_TRANSITIONS: Record<
  ReleaseState,
  readonly ReleaseState[]
> = {
  experimental: ["internal_test", "suspended", "retired"],
  internal_test: [
    "controlled_pilot_candidate",
    "experimental",
    "suspended",
    "retired",
  ],
  controlled_pilot_candidate: [
    "controlled_pilot",
    "internal_test",
    "suspended",
    "retired",
  ],
  controlled_pilot: [
    "production_supported",
    "controlled_pilot_candidate",
    "suspended",
    "retired",
  ],
  production_supported: ["suspended", "retired"],
  suspended: [
    "experimental",
    "internal_test",
    "controlled_pilot_candidate",
    "retired",
  ],
  retired: [],
};

export function canTransitionReleaseState(
  from: ReleaseState,
  to: ReleaseState
): boolean {
  if (from === to) return true;
  return ALLOWED_RELEASE_TRANSITIONS[from].includes(to);
}
