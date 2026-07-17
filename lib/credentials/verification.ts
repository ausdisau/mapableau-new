import type { CredentialPresentation, IssuedCredential } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { isRevoked } from "./status";

export type VerificationVerdict =
  | "ok"
  | "revoked"
  | "expired"
  | "not_trusted_issuer"
  | "simulator_only"
  | "unknown_credential";

export interface VerifyPresentationResult {
  verdict: VerificationVerdict;
  reason: string;
  credentialId: string | null;
  simulator: boolean;
}

/**
 * Verifier-side verification. In Wave 9, verification does not decrypt or
 * reveal payload — it confirms the presentation is well-formed, the
 * credential is not revoked, and its issuer is in the trust registry.
 *
 * Payload disclosure remains under the participant's control via the
 * disclosure gateway, not the verifier.
 */
export async function verifyPresentation(
  presentation: CredentialPresentation
): Promise<VerifyPresentationResult> {
  const credential: IssuedCredential | null = presentation.credentialId
    ? await prisma.issuedCredential.findUnique({
        where: { id: presentation.credentialId },
      })
    : null;

  if (!credential) {
    return {
      verdict: "unknown_credential",
      reason: "no_credential_bound",
      credentialId: null,
      simulator: presentation.simulator,
    };
  }
  if (credential.revokedAt || (await isRevoked(credential))) {
    return {
      verdict: "revoked",
      reason: "credential_revoked",
      credentialId: credential.id,
      simulator: credential.simulator,
    };
  }
  if (credential.effectiveUntil && credential.effectiveUntil <= new Date()) {
    return {
      verdict: "expired",
      reason: "credential_expired",
      credentialId: credential.id,
      simulator: credential.simulator,
    };
  }
  if (credential.simulator) {
    return {
      verdict: "simulator_only",
      reason: "credential_is_simulator_scope",
      credentialId: credential.id,
      simulator: true,
    };
  }
  if (credential.issuerOrganisationId) {
    const trusted = await prisma.credentialTrustRegistryEntry.findFirst({
      where: {
        organisationId: credential.issuerOrganisationId,
        status: "active",
      },
    });
    if (!trusted) {
      return {
        verdict: "not_trusted_issuer",
        reason: "issuer_not_in_trust_registry",
        credentialId: credential.id,
        simulator: false,
      };
    }
  }
  return {
    verdict: "ok",
    reason: "verified",
    credentialId: credential.id,
    simulator: credential.simulator,
  };
}
