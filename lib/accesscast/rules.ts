import type { AccessEvidenceClass } from "@/lib/access-intelligence-next";

import { NON_BLOCKING_ALONE_EVIDENCE_CLASSES } from "./evidence";
import {
  type AccessCastState,
  worseAccessCastState,
} from "./states";
import type {
  AccessCastFallback,
  AccessCastForecastHorizon,
  AccessCastRequirement,
} from "./types";

export type AccessCastRuleInputs = {
  requirements: AccessCastRequirement[];
  hasActiveVerifiedBlocker: boolean;
  hasConflicts: boolean;
  criticalEvidenceStale: boolean;
  hasSinglePointOfFailure: boolean;
  fallback: AccessCastFallback | null;
  hasAdditionalBurden: boolean;
  /** Evidence classes cited as the sole support for a blocking claim. */
  blockingEvidenceClasses: AccessEvidenceClass[];
  offlineBeyondExpiry: boolean;
  horizon: AccessCastForecastHorizon;
  serviceRequestedButUnconfirmed: boolean;
  overlappingUncertaintyOnHardRequirement: boolean;
};

/**
 * Deterministic AccessCast state calculation.
 * A language model must never call this with authority to override — this is the
 * sole authoritative state function.
 */
export function calculateAccessCastState(input: AccessCastRuleInputs): AccessCastState {
  const hard = input.requirements.filter((r) => r.hard);
  const failedHard = hard.filter((r) => r.status === "failed");
  const unresolvedHard = hard.filter((r) => r.status === "unresolved");

  // model_candidate / device estimates cannot independently create temporarily_unavailable
  const soleBlockerIsNonBlocking =
    input.hasActiveVerifiedBlocker &&
    input.blockingEvidenceClasses.length > 0 &&
    input.blockingEvidenceClasses.every((c) => NON_BLOCKING_ALONE_EVIDENCE_CLASSES.has(c));

  if (soleBlockerIsNonBlocking) {
    // Treat as unverified candidate mention path — not a hard block
    return resolveSoftUncertainty(input, unresolvedHard, failedHard);
  }

  if (input.hasActiveVerifiedBlocker || failedHard.length > 0) {
    return "temporarily_unavailable";
  }

  if (input.hasConflicts) {
    return "conflicting";
  }

  if (input.offlineBeyondExpiry) {
    return "stale";
  }

  if (input.criticalEvidenceStale) {
    return input.horizon === "long_range" ? "cannot_confirm" : "stale";
  }

  if (input.overlappingUncertaintyOnHardRequirement) {
    return "cannot_confirm";
  }

  if (unresolvedHard.length > 0 || input.serviceRequestedButUnconfirmed) {
    // Unconfirmed hard service with SPOF → fragile; otherwise cannot_confirm
    if (input.hasSinglePointOfFailure && !(input.fallback?.verified ?? false)) {
      return "fragile";
    }
    return "cannot_confirm";
  }

  if (input.hasSinglePointOfFailure && !(input.fallback?.verified ?? false)) {
    return "fragile";
  }

  if (input.hasAdditionalBurden) {
    return "degraded";
  }

  if (input.horizon === "long_range") {
    // Long-range must avoid operational predictions of stable
    return "likely_usable";
  }

  const softUnresolved = input.requirements.filter(
    (r) => !r.hard && r.status === "unresolved",
  );
  if (softUnresolved.length > 0) {
    return "likely_usable";
  }

  return "stable";
}

function resolveSoftUncertainty(
  input: AccessCastRuleInputs,
  unresolvedHard: AccessCastRequirement[],
  failedHard: AccessCastRequirement[],
): AccessCastState {
  if (failedHard.length > 0 && !input.hasActiveVerifiedBlocker) {
    return "cannot_confirm";
  }
  if (unresolvedHard.length > 0 || input.serviceRequestedButUnconfirmed) {
    if (input.hasSinglePointOfFailure && !(input.fallback?.verified ?? false)) {
      return "fragile";
    }
    return "cannot_confirm";
  }
  if (input.hasAdditionalBurden) return "degraded";
  return "likely_usable";
}

/** One failed hard requirement blocks likely_usable and stable. */
export function assertFailedHardBlocksStable(
  state: AccessCastState,
  failedHardCount: number,
): boolean {
  if (failedHardCount === 0) return true;
  return state !== "stable" && state !== "likely_usable";
}

/** Aggregate segment states — failed hard segment cannot be hidden. */
export function aggregateJourneyState(
  segmentStates: AccessCastState[],
  hardSegmentFailed: boolean,
): AccessCastState {
  if (segmentStates.length === 0) return "unknown";
  let overall = segmentStates[0]!;
  for (const s of segmentStates.slice(1)) {
    overall = worseAccessCastState(overall, s);
  }
  if (hardSegmentFailed && (overall === "stable" || overall === "likely_usable")) {
    return "cannot_confirm";
  }
  return overall;
}
