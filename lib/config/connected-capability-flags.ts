/**
 * MapAble Connected Capability Programme — server-side feature flags.
 * Safe defaults: all product capabilities off; permanent denies hard-coded false.
 * Client input must never enable server authority.
 */

function envTrue(name: string): boolean {
  return process.env[name] === "true";
}

export const connectedCapabilityFlags = {
  // CommunicationsOS
  communicationsEnabled: envTrue("MAPABLE_COMMUNICATIONS_ENABLED"),
  communicationPassportEnabled: envTrue(
    "MAPABLE_COMMUNICATION_PASSPORT_ENABLED"
  ),
  communicationRenderingEnabled: envTrue(
    "MAPABLE_COMMUNICATION_RENDERING_ENABLED"
  ),
  communicationHandoffsEnabled: envTrue(
    "MAPABLE_COMMUNICATION_HANDOFFS_ENABLED"
  ),

  // WorkforceOS
  workforceEnabled: envTrue("MAPABLE_WORKFORCE_ENABLED"),
  workerReadinessEnabled: envTrue("MAPABLE_WORKER_READINESS_ENABLED"),
  workerCredentialMonitoringEnabled: envTrue(
    "MAPABLE_WORKER_CREDENTIAL_MONITORING_ENABLED"
  ),
  workerCompetencyEnabled: envTrue("MAPABLE_WORKER_COMPETENCY_ENABLED"),

  // Academy
  academyEnabled: envTrue("MAPABLE_ACADEMY_ENABLED"),
  academyExternalLmsEnabled: envTrue("MAPABLE_ACADEMY_EXTERNAL_LMS_ENABLED"),
  academyCompletionSyncEnabled: envTrue(
    "MAPABLE_ACADEMY_COMPLETION_SYNC_ENABLED"
  ),
  academyCompetencyEvidenceEnabled: envTrue(
    "MAPABLE_ACADEMY_COMPETENCY_EVIDENCE_ENABLED"
  ),

  // Assistive Technology LifecycleOS
  atLifecycleEnabled: envTrue("MAPABLE_AT_LIFECYCLE_ENABLED"),
  equipmentPassportEnabled: envTrue("MAPABLE_EQUIPMENT_PASSPORT_ENABLED"),
  equipmentRepairEnabled: envTrue("MAPABLE_EQUIPMENT_REPAIR_ENABLED"),
  equipmentLoanEnabled: envTrue("MAPABLE_EQUIPMENT_LOAN_ENABLED"),

  // Companion
  companionEnabled: envTrue("MAPABLE_COMPANION_ENABLED"),
  companionOfflineEnabled: envTrue("MAPABLE_COMPANION_OFFLINE_ENABLED"),
  companionNotificationsEnabled: envTrue(
    "MAPABLE_COMPANION_NOTIFICATIONS_ENABLED"
  ),
  companionAccessLensEnabled: envTrue("MAPABLE_COMPANION_ACCESS_LENS_ENABLED"),

  // Outcomes
  outcomesEnabled: envTrue("MAPABLE_OUTCOMES_ENABLED"),
  outcomeContractsEnabled: envTrue("MAPABLE_OUTCOME_CONTRACTS_ENABLED"),
  outcomeReceiptsEnabled: envTrue("MAPABLE_OUTCOME_RECEIPTS_ENABLED"),

  // Provider Ops
  providerOpsEnabled: envTrue("MAPABLE_PROVIDER_OPS_ENABLED"),
  providerAttentionQueueEnabled: envTrue(
    "MAPABLE_PROVIDER_ATTENTION_QUEUE_ENABLED"
  ),

  // Regional Capacity
  regionalCapacityEnabled: envTrue("MAPABLE_REGIONAL_CAPACITY_ENABLED"),
  regionalCapacityMatchingEnabled: envTrue(
    "MAPABLE_REGIONAL_CAPACITY_MATCHING_ENABLED"
  ),
  regionalCapacityCommitmentsEnabled: envTrue(
    "MAPABLE_REGIONAL_CAPACITY_COMMITMENTS_ENABLED"
  ),

  // Developer Platform
  developerPlatformEnabled: envTrue("MAPABLE_DEVELOPER_PLATFORM_ENABLED"),
  developerSandboxEnabled: envTrue("MAPABLE_DEVELOPER_SANDBOX_ENABLED"),
  partnerWritesEnabled: envTrue("MAPABLE_PARTNER_WRITES_ENABLED"),

  /** Permanent safe defaults — never enable via env in this module. */
  autoWorkerAssignmentEnabled: false,
  aiCompetencyCertificationEnabled: false,
  aiEquipmentPrescriptionEnabled: false,
  aiOutcomeDeterminationEnabled: false,
  regionalAutoCommitEnabled: false,
  partnerUnrestrictedDataEnabled: false,
  aiPaymentOrClaimApprovalEnabled: false,
  physicalActionsEnabled: false,
} as const;

export function isCommunicationsEnabled(): boolean {
  return connectedCapabilityFlags.communicationsEnabled;
}

export function isCommunicationPassportEnabled(): boolean {
  return (
    connectedCapabilityFlags.communicationsEnabled &&
    connectedCapabilityFlags.communicationPassportEnabled
  );
}

export function isCommunicationRenderingEnabled(): boolean {
  return (
    connectedCapabilityFlags.communicationsEnabled &&
    connectedCapabilityFlags.communicationRenderingEnabled
  );
}

export function isCommunicationHandoffsEnabled(): boolean {
  return (
    connectedCapabilityFlags.communicationsEnabled &&
    connectedCapabilityFlags.communicationHandoffsEnabled
  );
}

export function isWorkforceEnabled(): boolean {
  return connectedCapabilityFlags.workforceEnabled;
}

export function isWorkerReadinessEnabled(): boolean {
  return (
    connectedCapabilityFlags.workforceEnabled &&
    connectedCapabilityFlags.workerReadinessEnabled
  );
}

export function isWorkerCredentialMonitoringEnabled(): boolean {
  return (
    connectedCapabilityFlags.workforceEnabled &&
    connectedCapabilityFlags.workerCredentialMonitoringEnabled
  );
}

export function isAcademyEnabled(): boolean {
  return connectedCapabilityFlags.academyEnabled;
}

export function isAcademyCompletionSyncEnabled(): boolean {
  return (
    connectedCapabilityFlags.academyEnabled &&
    connectedCapabilityFlags.academyCompletionSyncEnabled
  );
}

export function isAtLifecycleEnabled(): boolean {
  return connectedCapabilityFlags.atLifecycleEnabled;
}

export function isEquipmentPassportEnabled(): boolean {
  return (
    connectedCapabilityFlags.atLifecycleEnabled &&
    connectedCapabilityFlags.equipmentPassportEnabled
  );
}

export function isEquipmentRepairEnabled(): boolean {
  return (
    connectedCapabilityFlags.atLifecycleEnabled &&
    connectedCapabilityFlags.equipmentRepairEnabled
  );
}

export function isCompanionEnabled(): boolean {
  return connectedCapabilityFlags.companionEnabled;
}

export function isCompanionOfflineEnabled(): boolean {
  return (
    connectedCapabilityFlags.companionEnabled &&
    connectedCapabilityFlags.companionOfflineEnabled
  );
}

export function isOutcomesEnabled(): boolean {
  return connectedCapabilityFlags.outcomesEnabled;
}

export function isOutcomeContractsEnabled(): boolean {
  return (
    connectedCapabilityFlags.outcomesEnabled &&
    connectedCapabilityFlags.outcomeContractsEnabled
  );
}

export function isOutcomeReceiptsEnabled(): boolean {
  return (
    connectedCapabilityFlags.outcomesEnabled &&
    connectedCapabilityFlags.outcomeReceiptsEnabled
  );
}

export function isProviderOpsEnabled(): boolean {
  return connectedCapabilityFlags.providerOpsEnabled;
}

export function isProviderAttentionQueueEnabled(): boolean {
  return (
    connectedCapabilityFlags.providerOpsEnabled &&
    connectedCapabilityFlags.providerAttentionQueueEnabled
  );
}

export function isRegionalCapacityEnabled(): boolean {
  return connectedCapabilityFlags.regionalCapacityEnabled;
}

export function isRegionalCapacityMatchingEnabled(): boolean {
  return (
    connectedCapabilityFlags.regionalCapacityEnabled &&
    connectedCapabilityFlags.regionalCapacityMatchingEnabled
  );
}

export function isDeveloperPlatformEnabled(): boolean {
  return connectedCapabilityFlags.developerPlatformEnabled;
}

export function isDeveloperSandboxEnabled(): boolean {
  return (
    connectedCapabilityFlags.developerPlatformEnabled &&
    connectedCapabilityFlags.developerSandboxEnabled
  );
}
