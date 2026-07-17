/**
 * Registry of Prisma models with their data classification. This is a JSON-
 * style constant so we can enforce it at boot without a DB round-trip. The
 * companion table `TenantModelClassification` mirrors this for reporting.
 *
 * DO NOT weaken classifications. If a model is participant-facing, it stays
 * participant_data even if it is temporarily empty.
 */

export type Classification =
  | "participant_data"
  | "worker_data"
  | "claim_and_funding_data"
  | "organisation_operational_data"
  | "platform_operational_data"
  | "anonymised_aggregate"
  | "public_reference";

export interface ModelClassificationEntry {
  modelName: string;
  classification: Classification;
  organisationScoped: boolean;
  notes?: string;
}

export const MODEL_CLASSIFICATION_REGISTRY: ReadonlyArray<ModelClassificationEntry> = [
  // Participant / worker data
  { modelName: "ParticipantProfile", classification: "participant_data", organisationScoped: false, notes: "user-scoped" },
  { modelName: "CareRequest", classification: "participant_data", organisationScoped: true },
  { modelName: "CareBooking", classification: "participant_data", organisationScoped: true },
  { modelName: "CareShift", classification: "participant_data", organisationScoped: true },
  { modelName: "IncidentReport", classification: "participant_data", organisationScoped: true },
  { modelName: "WorkerProfile", classification: "worker_data", organisationScoped: true },

  // Claim / funding
  { modelName: "NdisClaimSnapshot", classification: "claim_and_funding_data", organisationScoped: true },
  { modelName: "NdisClaimBatch", classification: "claim_and_funding_data", organisationScoped: true },
  { modelName: "NdisBillableServiceItem", classification: "claim_and_funding_data", organisationScoped: true },
  { modelName: "NdisPaymentEvent", classification: "claim_and_funding_data", organisationScoped: true },
  { modelName: "NdisPaymentAllocation", classification: "claim_and_funding_data", organisationScoped: true },

  // Organisation operational
  { modelName: "Organisation", classification: "organisation_operational_data", organisationScoped: true, notes: "the tenant itself" },
  { modelName: "OrganisationMember", classification: "organisation_operational_data", organisationScoped: true },
  { modelName: "TenantEncryptionProfile", classification: "organisation_operational_data", organisationScoped: true },
  { modelName: "TenantFeatureEntitlement", classification: "organisation_operational_data", organisationScoped: true },
  { modelName: "TenantOnboardingCase", classification: "organisation_operational_data", organisationScoped: true },
  { modelName: "TenantPolicyProfile", classification: "organisation_operational_data", organisationScoped: true },
  { modelName: "TenantQuotaProfile", classification: "organisation_operational_data", organisationScoped: true },
  { modelName: "TenantOperationalHealth", classification: "organisation_operational_data", organisationScoped: true },
  { modelName: "TenantStatusTransition", classification: "organisation_operational_data", organisationScoped: true },
  { modelName: "GeneralAvailabilityAssessment", classification: "organisation_operational_data", organisationScoped: true },
  { modelName: "BreakGlassSession", classification: "organisation_operational_data", organisationScoped: true },
  { modelName: "DelegatedTenantAuthority", classification: "organisation_operational_data", organisationScoped: true },

  // Platform operational
  { modelName: "ProductionRelease", classification: "platform_operational_data", organisationScoped: false },
  { modelName: "ReleaseDeployment", classification: "platform_operational_data", organisationScoped: true },
  { modelName: "ServiceCatalogueEntry", classification: "platform_operational_data", organisationScoped: false },
  { modelName: "RegulatorySource", classification: "platform_operational_data", organisationScoped: false },
  { modelName: "RegulatoryChangeCase", classification: "platform_operational_data", organisationScoped: true, notes: "may be scoped or platform-wide" },
  { modelName: "TenantFederation", classification: "platform_operational_data", organisationScoped: false },
  { modelName: "FederationMembership", classification: "platform_operational_data", organisationScoped: true },

  // Reference
  { modelName: "TenantModelClassification", classification: "public_reference", organisationScoped: false },
];

export function classify(modelName: string): ModelClassificationEntry | undefined {
  return MODEL_CLASSIFICATION_REGISTRY.find(
    (m) => m.modelName === modelName
  );
}
