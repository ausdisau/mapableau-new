import { accessWalletConfig } from "@/lib/config/access-wallet";

import { getCredentialDefinition } from "./definitions";
import type {
  PresentationConsent,
  PresentationReceipt,
  PresentationRequest,
  WalletCredential,
} from "./types";

export class AccessWalletError extends Error {
  constructor(
    message: string,
    readonly statusCode = 400
  ) {
    super(message);
    this.name = "AccessWalletError";
  }
}

export function assertWalletEnabled(): void {
  if (!accessWalletConfig.enabled) {
    throw new AccessWalletError("MAPABLE_ACCESS_WALLET_ENABLED is false", 503);
  }
}

export function assertProductionIssuanceDisabled(): void {
  if (accessWalletConfig.productionIssuanceEnabled) {
    throw new AccessWalletError(
      "MAPABLE_WALLET_PRODUCTION_ISSUANCE_ENABLED must remain false during initial development",
      503
    );
  }
}

export function createPresentationRequest(input: {
  id: string;
  recipientId: string;
  requestingOrganisationId: string;
  purpose: string;
  exactRequestedClaims: string[];
  mandatoryClaims: string[];
  optionalClaims: string[];
  expiresAtIso: string;
  onwardSharingRule: PresentationRequest["onwardSharingRule"];
  legalOrContractualBasis: string;
  participantExplanation: string;
}): PresentationRequest {
  assertWalletEnabled();
  const definition = getCredentialDefinition(
    "communication_passport_presentation"
  );
  if (!definition) {
    throw new AccessWalletError("Credential definition missing");
  }

  const prohibited = input.exactRequestedClaims.filter((c) =>
    definition.prohibitedClaims.includes(c)
  );
  if (prohibited.length > 0) {
    throw new AccessWalletError(
      `Presentation request asks for prohibited claims: ${prohibited.join(", ")}`,
      400
    );
  }

  return {
    id: input.id,
    recipientId: input.recipientId,
    requestingOrganisationId: input.requestingOrganisationId,
    purpose: input.purpose,
    exactRequestedClaims: input.exactRequestedClaims,
    mandatoryClaims: input.mandatoryClaims,
    optionalClaims: input.optionalClaims,
    expiresAtIso: input.expiresAtIso,
    onwardSharingRule: input.onwardSharingRule,
    legalOrContractualBasis: input.legalOrContractualBasis,
    participantExplanation: input.participantExplanation,
  };
}

export function recordPresentationConsent(input: {
  id: string;
  request: PresentationRequest;
  participantId: string;
  approvedClaims: string[];
  rejectedClaims: string[];
  supporterInvolved?: boolean;
}): PresentationConsent {
  assertWalletEnabled();
  for (const claim of input.approvedClaims) {
    if (!input.request.exactRequestedClaims.includes(claim)) {
      throw new AccessWalletError(
        `Cannot approve claim not requested: ${claim}`
      );
    }
  }
  for (const mandatory of input.request.mandatoryClaims) {
    if (
      !input.approvedClaims.includes(mandatory) &&
      !input.rejectedClaims.includes(mandatory)
    ) {
      throw new AccessWalletError(
        `Mandatory claim ${mandatory} must be approved or explicitly rejected`
      );
    }
  }
  return {
    id: input.id,
    presentationRequestId: input.request.id,
    participantId: input.participantId,
    approvedClaims: input.approvedClaims,
    rejectedClaims: input.rejectedClaims,
    recipientId: input.request.recipientId,
    purpose: input.request.purpose,
    expiresAtIso: input.request.expiresAtIso,
    revokedAtIso: null,
    supporterInvolved: input.supporterInvolved ?? false,
  };
}

/**
 * Present approved claims only. Credential validity is separate from suitability.
 */
export function presentCredential(input: {
  credential: WalletCredential;
  consent: PresentationConsent;
  request: PresentationRequest;
  nowIso: string;
  roleContext?: string;
}): PresentationReceipt {
  assertWalletEnabled();
  assertProductionIssuanceDisabled();

  if (input.credential.holderParticipantId !== input.consent.participantId) {
    throw new AccessWalletError("Credential holder mismatch", 403);
  }
  // Tenant isolation is enforced by the API layer with server-derived tenant IDs.

  if (input.credential.status === "revoked") {
    return buildReceipt(input, "rejected", "revoked");
  }
  if (
    input.credential.status === "expired" ||
    (input.credential.expiresAtIso &&
      input.credential.expiresAtIso <= input.nowIso)
  ) {
    return buildReceipt(input, "expired", "active");
  }

  // Valid credential may still be unsuitable for a role — never conflate.
  if (input.roleContext === "clinical_decision_maker") {
    return buildReceipt(input, "unsuitable", "active");
  }

  const fieldsShared = input.consent.approvedClaims.filter(
    (c) => c in input.credential.claims
  );

  return {
    id: `pres-${input.consent.id}`,
    credentialId: input.credential.id,
    fieldsShared,
    recipientId: input.request.recipientId,
    purpose: input.request.purpose,
    issuedAtIso: input.nowIso,
    expiresAtIso: input.request.expiresAtIso,
    verifierResult: "accepted_synthetic",
    onwardSharingCondition: input.request.onwardSharingRule,
    revocationState: "active",
    nonWalletAlternativeProvided: true,
  };
}

function buildReceipt(
  input: {
    credential: WalletCredential;
    consent: PresentationConsent;
    request: PresentationRequest;
    nowIso: string;
  },
  verifierResult: PresentationReceipt["verifierResult"],
  revocationState: PresentationReceipt["revocationState"]
): PresentationReceipt {
  return {
    id: `pres-${input.consent.id}`,
    credentialId: input.credential.id,
    fieldsShared: [],
    recipientId: input.request.recipientId,
    purpose: input.request.purpose,
    issuedAtIso: input.nowIso,
    expiresAtIso: input.request.expiresAtIso,
    verifierResult,
    onwardSharingCondition: input.request.onwardSharingRule,
    revocationState,
    nonWalletAlternativeProvided: true,
  };
}

export function revokePresentationConsent(
  consent: PresentationConsent,
  nowIso: string
): PresentationConsent {
  return { ...consent, revokedAtIso: nowIso };
}
