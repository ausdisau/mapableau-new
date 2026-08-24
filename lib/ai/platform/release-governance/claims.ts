/**
 * Public claim control (Prompt 12).
 * Public claims derive from approved release state.
 * Experimental must not be described with prohibited assurance phrases.
 */

import { isProductionClaimEligibleState } from "./states";
import {
  PROHIBITED_EXPERIMENTAL_CLAIM_PHRASES,
  type GateFailure,
  type PublicClaimCheckInput,
  type ReleaseState,
} from "./types";

export type PublicClaimCheckResult = {
  allowed: boolean;
  failures: GateFailure[];
};

function normalizeClaimText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function prohibitedPhraseHits(claimText: string): string[] {
  const normalized = normalizeClaimText(claimText);
  return PROHIBITED_EXPERIMENTAL_CLAIM_PHRASES.filter((phrase) =>
    normalized.includes(phrase)
  );
}

/**
 * Reject claim mismatches for a given release state.
 * Does not invent compliance — absence of approval keeps public claims blocked.
 */
export function evaluatePublicClaim(
  input: PublicClaimCheckInput
): PublicClaimCheckResult {
  const failures: GateFailure[] = [];
  const state: ReleaseState = input.releaseState;

  if (!input.publicSurface) {
    if (state === "experimental" || state === "internal_test") {
      for (const hit of prohibitedPhraseHits(input.claimText)) {
        failures.push({
          code: `prohibited_phrase:${hit}`,
          gate: "claims",
          message: `Experimental/internal claim must not use phrase: ${hit}`,
        });
      }
    }
    return { allowed: failures.length === 0, failures };
  }

  if (state === "experimental" || state === "internal_test") {
    failures.push({
      code: "public_claim_blocked_for_state",
      gate: "claims",
      message: `Public claims are not allowed for release state ${state}`,
    });
    for (const hit of prohibitedPhraseHits(input.claimText)) {
      failures.push({
        code: `prohibited_phrase:${hit}`,
        gate: "claims",
        message: `Prohibited public claim phrase: ${hit}`,
      });
    }
  } else if (state === "controlled_pilot_candidate") {
    failures.push({
      code: "public_claim_blocked_for_candidate",
      gate: "claims",
      message:
        "controlled_pilot_candidate is not approved for public claims",
    });
  } else if (state === "controlled_pilot") {
    for (const hit of prohibitedPhraseHits(input.claimText)) {
      failures.push({
        code: `prohibited_phrase:${hit}`,
        gate: "claims",
        message: `Controlled pilot must not claim: ${hit}`,
      });
    }
  } else if (state === "suspended" || state === "retired") {
    failures.push({
      code: "public_claim_blocked_for_terminal_state",
      gate: "claims",
      message: `Public claims are not allowed for release state ${state}`,
    });
  } else if (isProductionClaimEligibleState(state)) {
    const stillBlocked = [
      "ndia approved",
      "ndia-approved",
      "ndis registered",
      "ndis-registered",
      "clinically validated",
      "clinically-validated",
      "fully autonomous",
      "fully-autonomous",
    ];
    const normalized = normalizeClaimText(input.claimText);
    for (const phrase of stillBlocked) {
      if (normalized.includes(phrase)) {
        failures.push({
          code: `unverified_assurance:${phrase}`,
          gate: "claims",
          message: `Phrase requires independent verification evidence: ${phrase}`,
        });
      }
    }
  }

  return { allowed: failures.length === 0, failures };
}

export function assertPublicClaimAllowed(
  input: PublicClaimCheckInput
): PublicClaimCheckResult {
  const result = evaluatePublicClaim(input);
  if (!result.allowed) {
    throw new Error(
      `PUBLIC_CLAIM_REJECTED:${result.failures.map((f) => f.code).join(",")}`
    );
  }
  return result;
}
