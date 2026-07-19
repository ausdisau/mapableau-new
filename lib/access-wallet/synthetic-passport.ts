import { accessWalletConfig } from "@/lib/config/access-wallet";

import type { CommunicationPassport } from "@/lib/communication-passport/types";

import { COMMUNICATION_PASSPORT_PRESENTATION_DEFINITION } from "./definitions";
import {
  AccessWalletError,
  assertProductionIssuanceDisabled,
  assertWalletEnabled,
} from "./presentation";
import type {
  StandardsAdapterStatus,
  WalletCredential,
} from "./types";

/**
 * Synthetic Communication Passport Presentation credential.
 * Projects disclosable passport fields only — never diagnosis or home address.
 */
export function issueSyntheticCommunicationPassportCredential(input: {
  credentialId: string;
  passport: CommunicationPassport;
  tenantId: string;
  issuerId: string;
  nowIso: string;
  processingTime?: string;
  aacRequirement?: boolean;
}): WalletCredential {
  assertWalletEnabled();
  assertProductionIssuanceDisabled();

  if (!accessWalletConfig.verifiableCredentialsEnabled) {
    throw new AccessWalletError(
      "MAPABLE_VERIFIABLE_CREDENTIALS_ENABLED is false",
      503
    );
  }

  const definition = COMMUNICATION_PASSPORT_PRESENTATION_DEFINITION;
  const selectedInstructions = input.passport.instructions
    .filter((i) => i.required || input.passport.disclosableFieldKeys.includes(i.mode))
    .slice(0, 5)
    .map((i) => i.participantWording)
    .join(" | ");

  const primaryMode =
    input.passport.instructions[0]?.mode ?? "plain_language";

  const expiresAtIso = definition.validityHours
    ? new Date(
        Date.parse(input.nowIso) + definition.validityHours * 3600_000
      ).toISOString()
    : null;

  const claims: Record<string, string | number | boolean | null> = {
    communicationMode: primaryMode,
    processingTime: input.processingTime ?? "extra_response_time",
    aacRequirement: input.aacRequirement ?? primaryMode === "aac",
    selectedAssistanceInstructions: selectedInstructions || "none_selected",
    expiry: expiresAtIso,
  };

  for (const prohibited of definition.prohibitedClaims) {
    if (prohibited in claims) {
      throw new AccessWalletError(
        `Prohibited claim leaked into credential: ${prohibited}`
      );
    }
  }

  return {
    id: input.credentialId,
    holderParticipantId: input.passport.participantId,
    tenantId: input.tenantId,
    issuerId: input.issuerId,
    credentialType: "communication_passport_presentation",
    claims,
    sourceRecordRefs: [
      {
        domain: "communication_passport",
        recordId: input.passport.participantId,
        version: input.passport.version,
      },
    ],
    issuedAtIso: input.nowIso,
    expiresAtIso,
    status: "issued_synthetic",
    revocationReason: null,
    correctionOfCredentialId: null,
    suitabilityEvaluated: false,
    endorsementClaim: "none",
  };
}

export function listStandardsAdapterStatuses(): StandardsAdapterStatus[] {
  return [
    {
      kind: "w3c_vc_data_model",
      configured: accessWalletConfig.verifiableCredentialsEnabled,
      productionReady: false,
      note: "Contract mapping only — no production issuance.",
    },
    {
      kind: "openid4vci",
      configured: accessWalletConfig.openid4vciEnabled,
      productionReady: false,
      note: "Adapter stub; MAPABLE_OPENID4VCI_ENABLED defaults false.",
    },
    {
      kind: "openid4vp",
      configured: accessWalletConfig.openid4vpEnabled,
      productionReady: false,
      note: "Adapter stub; MAPABLE_OPENID4VP_ENABLED defaults false.",
    },
    {
      kind: "openid_federation",
      configured: false,
      productionReady: false,
      note: "Not configured.",
    },
    {
      kind: "pairwise_identifier",
      configured: true,
      productionReady: false,
      note: "Pairwise holder/recipient identifiers preferred in presentations.",
    },
    {
      kind: "selective_disclosure",
      configured: true,
      productionReady: false,
      note: "Approved claims only; participant redaction supported.",
    },
  ];
}

/** Printable alternative without requiring a smartphone wallet. */
export function renderPrintablePassportPresentation(input: {
  credential: WalletCredential;
  fieldsShared: string[];
}): string {
  const lines = [
    "MapAble Communication Passport Presentation (printable)",
    "Not a government or NDIS digital identity credential.",
    `Credential: ${input.credential.id}`,
    `Status: ${input.credential.status}`,
    ...input.fieldsShared.map(
      (key) => `${key}: ${String(input.credential.claims[key] ?? "")}`
    ),
  ];
  return lines.join("\n");
}
