/**
 * ContinuityOS feature flags — server-side only.
 * Permanent safe defaults keep automatic assignment/cancellation/payment/clinical/physical off.
 * Client input must never activate these flags.
 */

export type ContinuityMode = "demo" | "shadow" | "supervised" | "production";

function envTrue(name: string): boolean {
  return process.env[name] === "true";
}

function envMode(): ContinuityMode {
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

/** Read flags live from process.env so tests and runtime toggles stay consistent. */
export function getContinuityOsFlags() {
  return {
    enabled: envTrue("MAPABLE_CONTINUITY_OS_ENABLED"),
    mode: envMode(),
    lifeEventsEnabled: envTrue("MAPABLE_LIFE_EVENTS_ENABLED"),
    lifeEventTemplatesEnabled: envTrue("MAPABLE_LIFE_EVENT_TEMPLATES_ENABLED"),
    dependencyGraphEnabled: envTrue("MAPABLE_CONTINUITY_DEPENDENCY_GRAPH_ENABLED"),
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
    accessFrictionLedgerEnabled: envTrue("MAPABLE_ACCESS_FRICTION_LEDGER_ENABLED"),
    regionalRecoveryEnabled: envTrue("MAPABLE_REGIONAL_RECOVERY_ENABLED"),
    recoveryOutcomeVerificationEnabled: envTrue(
      "MAPABLE_RECOVERY_OUTCOME_VERIFICATION_ENABLED"
    ),
    executeTransport: envTrue("MAPABLE_RECOVERY_EXECUTE_TRANSPORT"),
    executeCare: envTrue("MAPABLE_RECOVERY_EXECUTE_CARE"),
    executeNotifications: envTrue("MAPABLE_RECOVERY_EXECUTE_NOTIFICATIONS"),
    executeEquipment: envTrue("MAPABLE_RECOVERY_EXECUTE_EQUIPMENT"),
    executeVenueRequests: envTrue("MAPABLE_RECOVERY_EXECUTE_VENUE_REQUESTS"),
  } as const;
}

/** @deprecated Prefer getContinuityOsFlags() for live reads. */
export const continuityOsFlags = getContinuityOsFlags();

/** Permanent safe defaults — always false regardless of env typos that enable them. */
export const continuityOsPermanentDeny = {
  automaticAssignment: false,
  automaticCancellation: false,
  automaticPayment: false,
  clinicalActions: false,
  physicalActions: false,
} as const;

export function isContinuityOsEnabled(): boolean {
  return getContinuityOsFlags().enabled;
}

export function isLifeEventsEnabled(): boolean {
  const flags = getContinuityOsFlags();
  return flags.enabled && flags.lifeEventsEnabled;
}

export function isDependencyGraphEnabled(): boolean {
  const flags = getContinuityOsFlags();
  return flags.enabled && flags.dependencyGraphEnabled;
}

export function isResilienceEnabled(): boolean {
  const flags = getContinuityOsFlags();
  return flags.enabled && flags.resilienceEnabled;
}

export function isFailureDetectionEnabled(): boolean {
  const flags = getContinuityOsFlags();
  return flags.enabled && flags.serviceFailureDetectionEnabled;
}

export function isRecoveryOptionsEnabled(): boolean {
  const flags = getContinuityOsFlags();
  return flags.enabled && flags.recoveryOptionsEnabled;
}

export function isRecoveryPlaybooksEnabled(): boolean {
  const flags = getContinuityOsFlags();
  return flags.enabled && flags.recoveryPlaybooksEnabled;
}

export function isHandoffsEnabled(): boolean {
  const flags = getContinuityOsFlags();
  return flags.enabled && flags.recoveryHandoffsEnabled;
}

export function isFrictionEnabled(): boolean {
  const flags = getContinuityOsFlags();
  return flags.enabled && flags.accessFrictionLedgerEnabled;
}

export function isRegionalRecoveryEnabled(): boolean {
  const flags = getContinuityOsFlags();
  return flags.enabled && flags.regionalRecoveryEnabled;
}

export function isOutcomeVerificationEnabled(): boolean {
  const flags = getContinuityOsFlags();
  return flags.enabled && flags.recoveryOutcomeVerificationEnabled;
}

/** True when ContinuityOS may prepare proposals but must not execute domain writes. */
export function isShadowOrDemoMode(): boolean {
  const mode = getContinuityOsFlags().mode;
  return mode === "shadow" || mode === "demo";
}

/** True when approved domain execution adapters may run (still never automatic). */
export function mayExecuteApprovedRecoveryActions(): boolean {
  const flags = getContinuityOsFlags();
  if (!flags.enabled) return false;
  if (isShadowOrDemoMode()) return false;
  if (continuityOsPermanentDeny.automaticAssignment) return false;
  return flags.mode === "supervised" || flags.mode === "production";
}
