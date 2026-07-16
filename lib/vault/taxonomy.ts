import type {
  VaultCanonicalDomain,
  VaultClassification,
  VaultItemCategory,
  VaultTreatment,
} from "@/lib/vault/types";

export type VaultTaxonomyEntry = {
  itemType: string;
  category: VaultItemCategory;
  canonicalDomain: VaultCanonicalDomain;
  defaultTreatment: VaultTreatment;
  defaultClassification: VaultClassification;
  fieldManifest: string[];
  offlineEligible: boolean;
  exportable: boolean;
  deletionLimitations: string[];
  humanReviewRequired: boolean;
  canonicalOwnerLabel: string;
};

/**
 * Frozen Wave 0 routing/taxonomy table.
 * Models and AI must not invent or downgrade these mappings.
 */
export const VAULT_TAXONOMY: Record<string, VaultTaxonomyEntry> = {
  accessibility_profile: {
    itemType: "accessibility_profile",
    category: "access",
    canonicalDomain: "accessibility_profile",
    defaultTreatment: "reference_only",
    defaultClassification: "personal",
    fieldManifest: [
      "communicationPreferences",
      "sensoryPreferences",
      "cognitivePreferences",
      "digitalPreferences",
      "mobilityNeeds",
      "transportRequirements",
    ],
    offlineEligible: true,
    exportable: true,
    deletionLimitations: [
      "Canonical AccessibilityProfile must be deleted separately in MapAble Core.",
    ],
    humanReviewRequired: false,
    canonicalOwnerLabel: "MapAble Core — AccessibilityProfile",
  },
  access_passport: {
    itemType: "access_passport",
    category: "access",
    canonicalDomain: "access_passport",
    defaultTreatment: "reference_only",
    defaultClassification: "sensitive_personal",
    fieldManifest: [
      "communicationPreferences",
      "mobilityAids",
      "requirements",
      "sharingDefaults",
    ],
    offlineEligible: true,
    exportable: true,
    deletionLimitations: [
      "Canonical Access Passport remains until deleted in Access Intelligence / AURA domain.",
    ],
    humanReviewRequired: false,
    canonicalOwnerLabel: "MapAble Access Intelligence — AiAccessPassport",
  },
  aura_memory_card: {
    itemType: "aura_memory_card",
    category: "access",
    canonicalDomain: "aura_memory",
    defaultTreatment: "reference_only",
    defaultClassification: "participant_private",
    fieldManifest: ["content", "structuredPreference", "purpose", "modules"],
    offlineEligible: true,
    exportable: true,
    deletionLimitations: [
      "Canonical AuraMemoryCard must be deleted in the AURA Memory domain.",
    ],
    humanReviewRequired: false,
    canonicalOwnerLabel: "MapAble AURA — AuraMemoryCard",
  },
  careos_mission: {
    itemType: "careos_mission",
    category: "access",
    canonicalDomain: "careos_mission",
    defaultTreatment: "reference_only",
    defaultClassification: "personal",
    fieldManifest: ["missionType", "desiredOutcome", "status", "inputSummary"],
    offlineEligible: false,
    exportable: false,
    deletionLimitations: ["Mission records follow CareOS retention."],
    humanReviewRequired: false,
    canonicalOwnerLabel: "MapAble CareOS — CareOSMission",
  },
  visit_plan: {
    itemType: "visit_plan",
    category: "access",
    canonicalDomain: "visit_plan",
    defaultTreatment: "reference_only",
    defaultClassification: "personal",
    fieldManifest: ["title", "scheduledAt", "payload", "shareScopes"],
    offlineEligible: true,
    exportable: true,
    deletionLimitations: [
      "VisitPlan and VisitPlanShare remain in indoor accessibility domain.",
    ],
    humanReviewRequired: false,
    canonicalOwnerLabel: "MapAble Indoor Accessibility — VisitPlan",
  },
  offline_visit_pack: {
    itemType: "offline_visit_pack",
    category: "access",
    canonicalDomain: "careos_mission",
    defaultTreatment: "reference_only",
    defaultClassification: "personal",
    fieldManifest: ["snapshotSummary", "staleAfter", "status"],
    offlineEligible: true,
    exportable: false,
    deletionLimitations: [
      "Local offline copies may be deleted; canonical pack remains until mission delete.",
    ],
    humanReviewRequired: false,
    canonicalOwnerLabel: "MapAble AURA — AuraOfflineVisitPack",
  },
  equipment_passport: {
    itemType: "equipment_passport",
    category: "equipment",
    canonicalDomain: "equipment_passport",
    defaultTreatment: "reference_only",
    defaultClassification: "sensitive_personal",
    fieldManifest: [
      "dimensions",
      "weight",
      "rampOrientation",
      "handlingInstructions",
      "batteryInfo",
    ],
    offlineEligible: true,
    exportable: true,
    deletionLimitations: [
      "Until Equipment Passport domain lands, dimensions may reference Access Passport JSON only.",
    ],
    humanReviewRequired: false,
    canonicalOwnerLabel: "MapAble Assistive Technology — EquipmentPassport",
  },
  consent_record: {
    itemType: "consent_record",
    category: "decisions_authority",
    canonicalDomain: "consent_record",
    defaultTreatment: "metadata_only",
    defaultClassification: "authority_evidence",
    fieldManifest: ["scope", "purpose", "status", "expiryDate", "shareMode"],
    offlineEligible: false,
    exportable: true,
    deletionLimitations: [
      "Consent history may be retained for legal and audit reasons.",
    ],
    humanReviewRequired: false,
    canonicalOwnerLabel: "MapAble Core — ConsentRecord",
  },
  rights_policy: {
    itemType: "rights_policy",
    category: "decisions_authority",
    canonicalDomain: "rights_os",
    defaultTreatment: "metadata_only",
    defaultClassification: "authority_evidence",
    fieldManifest: ["purposeCode", "outcome", "allowedFields", "deniedFields"],
    offlineEligible: false,
    exportable: true,
    deletionLimitations: ["Rights decisions may be retained for audit."],
    humanReviewRequired: false,
    canonicalOwnerLabel: "MapAble RightsOS — RightsPolicyDecision",
  },
  worker_trust_credential: {
    itemType: "worker_trust_credential",
    category: "trust",
    canonicalDomain: "credential",
    defaultTreatment: "reference_only",
    defaultClassification: "credential_secret",
    fieldManifest: ["status", "issuer", "expiresAt"],
    offlineEligible: false,
    exportable: false,
    deletionLimitations: ["Issuer remains credential source of truth."],
    humanReviewRequired: false,
    canonicalOwnerLabel: "MapAble Trust Passport — WorkerTrustCredential",
  },
  document: {
    itemType: "document",
    category: "documents",
    canonicalDomain: "document",
    defaultTreatment: "reference_only",
    defaultClassification: "sensitive_personal",
    fieldManifest: ["title", "visibility", "scanStatus", "createdAt"],
    offlineEligible: false,
    exportable: true,
    deletionLimitations: [
      "Document bytes remain in object storage until canonical Document delete.",
    ],
    humanReviewRequired: false,
    canonicalOwnerLabel: "MapAble Core — Document",
  },
  trusted_contact: {
    itemType: "trusted_contact",
    category: "contacts",
    canonicalDomain: "vault_native",
    defaultTreatment: "encrypted_original",
    defaultClassification: "personal",
    fieldManifest: ["displayName", "relationship", "contactMethod", "purposes"],
    offlineEligible: true,
    exportable: true,
    deletionLimitations: ["Vault-native contact may be deleted from Vault."],
    humanReviewRequired: false,
    canonicalOwnerLabel: "MapAble Personal Access Vault",
  },
  emergency_subset: {
    itemType: "emergency_subset",
    category: "vault_native",
    canonicalDomain: "vault_native",
    defaultTreatment: "local_only",
    defaultClassification: "emergency_continuity",
    fieldManifest: [
      "communicationMethod",
      "emergencyContacts",
      "equipmentHandling",
      "powerDependency",
    ],
    offlineEligible: true,
    exportable: true,
    deletionLimitations: [
      "Optional subset only; does not replace clinical or emergency-service records.",
    ],
    humanReviewRequired: true,
    canonicalOwnerLabel: "MapAble Personal Access Vault",
  },
  recovery_configuration: {
    itemType: "recovery_configuration",
    category: "vault_native",
    canonicalDomain: "vault_native",
    defaultTreatment: "encrypted_original",
    defaultClassification: "security_restricted",
    fieldManifest: ["method", "threshold", "trustedContactRefs"],
    offlineEligible: false,
    exportable: false,
    deletionLimitations: ["Recovery config changes require participant involvement."],
    humanReviewRequired: true,
    canonicalOwnerLabel: "MapAble Personal Access Vault",
  },
  portable_export_package: {
    itemType: "portable_export_package",
    category: "portability",
    canonicalDomain: "vault_native",
    defaultTreatment: "encrypted_original",
    defaultClassification: "sensitive_personal",
    fieldManifest: ["manifest", "itemIndex", "exportVersion"],
    offlineEligible: false,
    exportable: true,
    deletionLimitations: ["Downloaded copies are outside MapAble control."],
    humanReviewRequired: false,
    canonicalOwnerLabel: "MapAble Personal Access Vault",
  },
  imported_unrouted: {
    itemType: "imported_unrouted",
    category: "portability",
    canonicalDomain: "vault_native",
    defaultTreatment: "not_permitted",
    defaultClassification: "security_restricted",
    fieldManifest: ["sourceManifest"],
    offlineEligible: false,
    exportable: false,
    deletionLimitations: ["Quarantined until routed or rejected."],
    humanReviewRequired: true,
    canonicalOwnerLabel: "MapAble Personal Access Vault — quarantine",
  },
};

export function getTaxonomyEntry(itemType: string): VaultTaxonomyEntry | null {
  return VAULT_TAXONOMY[itemType] ?? null;
}
