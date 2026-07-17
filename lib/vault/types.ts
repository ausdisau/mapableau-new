/**
 * MapAble Personal Access Vault — shared types.
 * Hybrid Capability Vault: indexes canonical domains; does not duplicate SoTs.
 */

export type VaultMode = "demo" | "shadow" | "supervised" | "production";

export type VaultCanonicalDomain =
  | "accessibility_profile"
  | "access_passport"
  | "aura_memory"
  | "careos_mission"
  | "visit_plan"
  | "equipment_passport"
  | "rights_os"
  | "consent_record"
  | "credential"
  | "document"
  | "vault_native"
  | "unknown";

export type VaultTreatment =
  | "reference_only"
  | "encrypted_copy"
  | "encrypted_original"
  | "local_only"
  | "metadata_only"
  | "not_permitted";

export type VaultClassification =
  | "public"
  | "participant_private"
  | "personal"
  | "sensitive_personal"
  | "health_related"
  | "identity_reference"
  | "credential_secret"
  | "authority_evidence"
  | "child_related"
  | "employment_confidential"
  | "legal_complaint"
  | "security_restricted"
  | "emergency_continuity"
  | "deidentified_aggregate";

export type VaultItemCategory =
  | "identity_reference"
  | "access"
  | "equipment"
  | "trust"
  | "decisions_authority"
  | "documents"
  | "contacts"
  | "portability"
  | "vault_native";

export type VaultCanonicalRouteDecision = {
  itemType: string;
  canonicalDomain: VaultCanonicalDomain;
  canonicalRecordId?: string;
  vaultTreatment: VaultTreatment;
  classification: VaultClassification;
  category: VaultItemCategory;
  reasons: string[];
  participantReviewRequired: boolean;
  humanReviewRequired: boolean;
  fieldManifest: string[];
};

export type VaultFieldManifestEntry = {
  field: string;
  classification: VaultClassification;
  shareableByDefault: boolean;
};

export type VaultNutritionLabel = {
  itemId: string;
  itemName: string;
  canonicalSource: string;
  ownerUserId: string;
  purpose: string;
  fields: string[];
  sensitivity: VaultClassification;
  storageLocation: string;
  encryptionState: string;
  devicesWithCopy: string[];
  organisationsWithAccess: string[];
  expiresAt: string | null;
  retentionReason: string;
  lastUseAt: string | null;
  lastDisclosureAt: string | null;
  exportStatus: string;
  deletionOptions: string[];
  limitations: string[];
  auditLink: string;
};

export type VaultDisclosureCompileResult = {
  purposeCode: string;
  permittedFields: string[];
  deniedFields: string[];
  reasons: Array<{ code: string; message: string; field?: string }>;
  alternativePredicate?: string;
  derivedClaimOption?: string;
  participantReviewRequired: boolean;
  humanReviewRequired: boolean;
  mode: "shadow" | "live";
};

export type VaultLedgerEntry = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
  summary: string;
};
