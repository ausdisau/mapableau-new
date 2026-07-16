/**
 * ContinuityOS feature flags — server-side only.
 * Browser / client input must never activate these flags.
 * All defaults are fail-closed (false / shadow).
 */

export type ContinuityMode = "demo" | "shadow" | "supervised" | "production";

function envTrue(name: string): boolean {
  return process.env[name] === "true";
}

function continuityMode(): ContinuityMode {
  const raw = (process.env.MAPABLE_CONTINUITY_MODE ?? "shadow").toLowerCase();
  if (
    raw === "demo" ||
    raw === "shadow" ||
    raw === "supervised" ||
    raw === "production"
  ) {
    return raw;
  }
  return "shadow";
}

export const continuityOsConfig = {
  enabled: envTrue("MAPABLE_CONTINUITY_OS_ENABLED"),
  mode: continuityMode(),
  lifeEventsEnabled: envTrue("MAPABLE_LIFE_EVENTS_ENABLED"),
  lifeEventTemplatesEnabled: envTrue("MAPABLE_LIFE_EVENT_TEMPLATES_ENABLED"),
  dependencyGraphEnabled: envTrue(
    "MAPABLE_CONTINUITY_DEPENDENCY_GRAPH_ENABLED"
  ),
  resilienceEnabled: envTrue("MAPABLE_CONTINUITY_RESILIENCE_ENABLED"),
  serviceFailureDetectionEnabled: envTrue(
    "MAPABLE_SERVICE_FAILURE_DETECTION_ENABLED"
  ),
  recoveryOptionsEnabled: envTrue("MAPABLE_RECOVERY_OPTIONS_ENABLED"),
  recoveryPlaybooksEnabled: envTrue("MAPABLE_RECOVERY_PLAYBOOKS_ENABLED"),
  recoveryHandoffsEnabled: envTrue("MAPABLE_RECOVERY_HANDOFFS_ENABLED"),
  recoveryHumanAssistanceEnabled: envTrue(
    "MAPABLE_RECOVERY_HUMAN_ASSISTANCE_ENABLED"
  ),
  recoveryFinancialRemedyEnabled: envTrue(
    "MAPABLE_RECOVERY_FINANCIAL_REMEDY_ENABLED"
  ),
  accessFrictionLedgerEnabled: envTrue(
    "MAPABLE_ACCESS_FRICTION_LEDGER_ENABLED"
  ),
  regionalRecoveryEnabled: envTrue("MAPABLE_REGIONAL_RECOVERY_ENABLED"),
  recoveryOutcomeVerificationEnabled: envTrue(
    "MAPABLE_RECOVERY_OUTCOME_VERIFICATION_ENABLED"
  ),
  /** Action-specific execute flags — default false permanently unless signed off. */
  executeTransport: envTrue("MAPABLE_RECOVERY_EXECUTE_TRANSPORT"),
  executeCare: envTrue("MAPABLE_RECOVERY_EXECUTE_CARE"),
  executeNotifications: envTrue("MAPABLE_RECOVERY_EXECUTE_NOTIFICATIONS"),
  executeEquipment: envTrue("MAPABLE_RECOVERY_EXECUTE_EQUIPMENT"),
  executeVenueRequests: envTrue("MAPABLE_RECOVERY_EXECUTE_VENUE_REQUESTS"),
  /** Permanent safe defaults — must remain false unless explicit signed approval. */
  automaticAssignmentEnabled: envTrue(
    "MAPABLE_RECOVERY_AUTOMATIC_ASSIGNMENT_ENABLED"
  ),
  automaticCancellationEnabled: envTrue(
    "MAPABLE_RECOVERY_AUTOMATIC_CANCELLATION_ENABLED"
  ),
  automaticPaymentEnabled: envTrue(
    "MAPABLE_RECOVERY_AUTOMATIC_PAYMENT_ENABLED"
  ),
  clinicalActionsEnabled: envTrue("MAPABLE_RECOVERY_CLINICAL_ACTIONS_ENABLED"),
  physicalActionsEnabled: envTrue("MAPABLE_RECOVERY_PHYSICAL_ACTIONS_ENABLED"),
};

export function isContinuityOsEnabled(): boolean {
  return continuityOsConfig.enabled;
}

export function isLifeEventsEnabled(): boolean {
  return (
    continuityOsConfig.enabled && continuityOsConfig.lifeEventsEnabled
  );
}

export function isDependencyGraphEnabled(): boolean {
  return (
    isLifeEventsEnabled() && continuityOsConfig.dependencyGraphEnabled
  );
}

export function isResilienceEnabled(): boolean {
  return isLifeEventsEnabled() && continuityOsConfig.resilienceEnabled;
}

export function isFailureDetectionEnabled(): boolean {
  return (
    continuityOsConfig.enabled &&
    continuityOsConfig.serviceFailureDetectionEnabled
  );
}

export function isRecoveryOptionsEnabled(): boolean {
  return (
    continuityOsConfig.enabled && continuityOsConfig.recoveryOptionsEnabled
  );
}

export function isRecoveryPlaybooksEnabled(): boolean {
  return (
    continuityOsConfig.enabled && continuityOsConfig.recoveryPlaybooksEnabled
  );
}

export function isHandoffsEnabled(): boolean {
  return (
    continuityOsConfig.enabled && continuityOsConfig.recoveryHandoffsEnabled
  );
}

export function isShadowMode(): boolean {
  return continuityOsConfig.mode === "shadow" || continuityOsConfig.mode === "demo";
}

export function canExecuteRecoveryActions(): boolean {
  if (!continuityOsConfig.enabled) return false;
  if (isShadowMode()) return false;
  if (continuityOsConfig.automaticAssignmentEnabled) return false;
  if (continuityOsConfig.automaticCancellationEnabled) return false;
  if (continuityOsConfig.automaticPaymentEnabled) return false;
  if (continuityOsConfig.clinicalActionsEnabled) return false;
  if (continuityOsConfig.physicalActionsEnabled) return false;
  return (
    continuityOsConfig.mode === "supervised" ||
    continuityOsConfig.mode === "production"
  );
}

/** Permanent prohibitions — never treat as runtime-togglable in product UX. */
export const CONTINUITY_OS_PERMANENT_PROHIBITIONS = [
  "MAPABLE_RECOVERY_AUTOMATIC_ASSIGNMENT_ENABLED",
  "MAPABLE_RECOVERY_AUTOMATIC_CANCELLATION_ENABLED",
  "MAPABLE_RECOVERY_AUTOMATIC_PAYMENT_ENABLED",
  "MAPABLE_RECOVERY_CLINICAL_ACTIONS_ENABLED",
  "MAPABLE_RECOVERY_PHYSICAL_ACTIONS_ENABLED",
] as const;
