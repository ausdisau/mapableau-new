import type { ProcessingProviderRecord } from "./contracts";

/**
 * In-code processing-provider governance seed.
 * No secrets. Fail closed: unlisted / unapproved providers are ineligible.
 */
const PROVIDERS: ProcessingProviderRecord[] = [
  {
    providerId: "mapable.device_edge",
    displayName: "MapAble Device Edge Runtime",
    processorType: "device_runtime",
    approved: true,
    deploymentZones: ["DEVICE_EDGE"],
    permittedSensitivity: [
      "D0_PUBLIC",
      "D1_INTERNAL",
      "D2_PERSONAL",
      "D3_SENSITIVE",
    ],
    permittedDataClasses: [
      "public",
      "operational",
      "participant_pii",
      "health_sensitive",
      "safeguarding",
    ],
    prohibitedDataClasses: ["credentials_secrets", "legal_privileged"],
    permittedPurposes: [
      "pii_pre_detection",
      "prompt_injection_screening",
      "content_safety_screening",
      "accessibility_adaptation",
    ],
    jurisdictions: ["AU"],
    dataResidency: ["device_local"],
    subprocessors: [],
    remoteAdminJurisdictions: [],
    retentionPolicy: "ephemeral_device_only",
    modelTrainingUse: "prohibited",
    loggingPolicy: "minimal_local",
    breachNotificationCommitment: "n/a_device_local",
    contractReference: null,
    privacyReviewStatus: "approved",
    securityReviewStatus: "approved",
    reviewDueDate: "2027-01-01",
    killSwitchKey: "guardian.device_edge",
    algorithmRegisterRef: null,
  },
  {
    providerId: "mapable.private_inference",
    displayName: "MapAble Private Inference",
    processorType: "mapable_private",
    approved: true,
    deploymentZones: ["MAPABLE_PRIVATE"],
    permittedSensitivity: [
      "D0_PUBLIC",
      "D1_INTERNAL",
      "D2_PERSONAL",
      "D3_SENSITIVE",
    ],
    permittedDataClasses: [
      "public",
      "operational",
      "participant_pii",
      "health_sensitive",
      "safeguarding",
    ],
    prohibitedDataClasses: ["credentials_secrets"],
    permittedPurposes: [
      "support_request_analysis",
      "safeguarding_classification",
      "complaint_intake_assist",
      "incident_intake_assist",
      "plain_language_explanation",
      "shift_support_context_minimised",
      "pii_pre_detection",
      "content_safety_screening",
    ],
    jurisdictions: ["AU"],
    dataResidency: ["AU"],
    subprocessors: [],
    remoteAdminJurisdictions: ["AU"],
    retentionPolicy: "purpose_limited_short",
    modelTrainingUse: "prohibited",
    loggingPolicy: "refs_only",
    breachNotificationCommitment: "notify_within_72h",
    contractReference: "mapable-private-inference-internal",
    privacyReviewStatus: "in_progress",
    securityReviewStatus: "in_progress",
    reviewDueDate: "2026-12-01",
    killSwitchKey: "guardian.private_inference",
    algorithmRegisterRef: null,
  },
  {
    providerId: "mapable.deterministic",
    displayName: "MapAble Deterministic Policy Engine",
    processorType: "deterministic_only",
    approved: true,
    deploymentZones: ["DEVICE_EDGE", "MAPABLE_PRIVATE"],
    permittedSensitivity: [
      "D0_PUBLIC",
      "D1_INTERNAL",
      "D2_PERSONAL",
      "D3_SENSITIVE",
      "D4_RESTRICTED",
    ],
    permittedDataClasses: [
      "public",
      "operational",
      "participant_pii",
      "health_sensitive",
      "financial",
      "safeguarding",
      "credentials_secrets",
      "legal_privileged",
    ],
    prohibitedDataClasses: [],
    permittedPurposes: [
      "worker_readiness_policy_check",
      "audit_transparency",
      "participant_challenge_explanation",
      "shift_support_context_minimised",
    ],
    jurisdictions: ["AU"],
    dataResidency: ["AU"],
    subprocessors: [],
    remoteAdminJurisdictions: ["AU"],
    retentionPolicy: "audit_refs",
    modelTrainingUse: "none",
    loggingPolicy: "refs_only",
    breachNotificationCommitment: "n/a_deterministic",
    contractReference: null,
    privacyReviewStatus: "approved",
    securityReviewStatus: "approved",
    reviewDueDate: null,
    killSwitchKey: "guardian.deterministic",
    algorithmRegisterRef: null,
  },
];

export function listProcessingProviders(): ProcessingProviderRecord[] {
  return [...PROVIDERS];
}

export function getProcessingProvider(
  providerId: string
): ProcessingProviderRecord | undefined {
  return PROVIDERS.find((p) => p.providerId === providerId);
}

export function listApprovedProcessingProviders(): ProcessingProviderRecord[] {
  return PROVIDERS.filter(
    (p) =>
      p.approved &&
      p.privacyReviewStatus !== "rejected" &&
      p.securityReviewStatus !== "rejected"
  );
}
