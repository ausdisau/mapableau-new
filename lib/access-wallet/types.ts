/**
 * Portable Access Wallet contracts.
 * Selective disclosure only — no full-record sharing by default.
 * Not government or NDIS endorsed.
 */

export const WALLET_CREDENTIAL_TYPES = [
  "communication_passport_presentation",
  "participant_service_standard",
  "access_requirements",
  "equipment_passport",
  "authority_receipt",
  "consent_receipt",
  "worker_credential_evidence",
  "navigator_evidence",
  "venue_access_attestation",
  "service_agreement_receipt",
  "ai_output_receipt",
  "participant_outcome_receipt",
  "selected_service_history",
  "emergency_information_subset",
] as const;

export type WalletCredentialType = (typeof WALLET_CREDENTIAL_TYPES)[number];

export type WalletCredentialDefinition = {
  type: WalletCredentialType;
  issuerType: "mapable_synthetic" | "mapable_org" | "external_adapter";
  schemaId: string;
  requiredClaims: string[];
  optionalClaims: string[];
  prohibitedClaims: string[];
  validityHours: number | null;
  revocationMethod: "status_list" | "local_revoke" | "none";
  assuranceLevel: "synthetic" | "self_asserted" | "org_attested";
  publicClaimState: "not_claimable";
};

export type WalletCredentialStatus =
  | "draft"
  | "issued_synthetic"
  | "active"
  | "expired"
  | "revoked"
  | "corrected";

export type WalletCredential = {
  id: string;
  holderParticipantId: string;
  tenantId: string;
  issuerId: string;
  credentialType: WalletCredentialType;
  claims: Record<string, string | number | boolean | null>;
  sourceRecordRefs: { domain: string; recordId: string; version?: number }[];
  issuedAtIso: string;
  expiresAtIso: string | null;
  status: WalletCredentialStatus;
  revocationReason: string | null;
  correctionOfCredentialId: string | null;
  /** Validity ≠ suitability for a role. */
  suitabilityEvaluated: false;
  endorsementClaim: "none";
};

export type PresentationRequest = {
  id: string;
  recipientId: string;
  requestingOrganisationId: string;
  purpose: string;
  exactRequestedClaims: string[];
  mandatoryClaims: string[];
  optionalClaims: string[];
  expiresAtIso: string;
  onwardSharingRule: "prohibited" | "purpose_bound" | "participant_approved";
  legalOrContractualBasis: string;
  participantExplanation: string;
};

export type PresentationConsent = {
  id: string;
  presentationRequestId: string;
  participantId: string;
  approvedClaims: string[];
  rejectedClaims: string[];
  recipientId: string;
  purpose: string;
  expiresAtIso: string;
  revokedAtIso: string | null;
  supporterInvolved: boolean;
};

export type PresentationReceipt = {
  id: string;
  credentialId: string;
  fieldsShared: string[];
  recipientId: string;
  purpose: string;
  issuedAtIso: string;
  expiresAtIso: string;
  verifierResult: "accepted_synthetic" | "rejected" | "expired" | "unsuitable";
  onwardSharingCondition: PresentationRequest["onwardSharingRule"];
  revocationState: "active" | "revoked";
  /** Printable / web alternative available without wallet app. */
  nonWalletAlternativeProvided: true;
};

/** Standards adapter stubs — contracts only; no production OID4VCI/VP. */
export type StandardsAdapterKind =
  | "w3c_vc_data_model"
  | "openid4vci"
  | "openid4vp"
  | "openid_federation"
  | "pairwise_identifier"
  | "selective_disclosure";

export type StandardsAdapterStatus = {
  kind: StandardsAdapterKind;
  configured: boolean;
  productionReady: false;
  note: string;
};
