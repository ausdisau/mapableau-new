import { mobileApiConfig } from "@/lib/mobile/config";

export type IntegrityVerifyResult = {
  acceptable: BooleanLike;
  reason: string;
  enforced: boolean;
};

type BooleanLike = boolean;

/**
 * Play Integrity verification scaffold (Phase 15).
 * Never used for disability/eligibility decisions.
 * When integrity flag is off or attestation missing, returns acceptable risk fallback.
 */
export function verifyPlayIntegrityAttestation(input: {
  attestationToken: string | null | undefined;
  debugBypass?: boolean;
}): IntegrityVerifyResult {
  if (!mobileApiConfig.integrityEnabled) {
    return {
      acceptable: true,
      reason: "integrity_not_enforced",
      enforced: false,
    };
  }

  if (input.debugBypass && process.env.NODE_ENV !== "production") {
    return {
      acceptable: true,
      reason: "debug_bypass",
      enforced: true,
    };
  }

  if (!input.attestationToken || input.attestationToken.length < 10) {
    return {
      acceptable: true,
      reason: "attestation_unavailable_risk_fallback",
      enforced: true,
    };
  }

  // Production: decode/verify with Google Play Integrity API using service account.
  // Scaffold accepts non-empty token as presentational signal only.
  return {
    acceptable: true,
    reason: "attestation_present_scaffold",
    enforced: true,
  };
}
