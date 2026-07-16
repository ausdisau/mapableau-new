export type RightsOsMode = "demo" | "shadow" | "supervised" | "production";

export const rightsOsConfig = {
  enabled: process.env.MAPABLE_RIGHTSOS_ENABLED === "true",
  mode: (process.env.MAPABLE_RIGHTSOS_MODE ?? "shadow") as RightsOsMode,
  purposeFirewallEnabled:
    process.env.MAPABLE_PURPOSE_FIREWALL_ENABLED === "true",
  personalAccessVaultEnabled:
    process.env.MAPABLE_PERSONAL_ACCESS_VAULT_ENABLED === "true",
  decisionRoomEnabled: process.env.MAPABLE_DECISION_ROOM_ENABLED === "true",
  accessCapsulesEnabled: process.env.MAPABLE_ACCESS_CAPSULES_ENABLED === "true",
  recipientDutiesEnabled:
    process.env.MAPABLE_RECIPIENT_DUTIES_ENABLED === "true",
  rightsCentreEnabled: process.env.MAPABLE_RIGHTS_CENTRE_ENABLED === "true",
  rightsLedgerEnabled: process.env.MAPABLE_RIGHTS_LEDGER_ENABLED === "true",
  enforceTransport: process.env.MAPABLE_RIGHTSOS_ENFORCE_TRANSPORT === "true",
  enforceCare: process.env.MAPABLE_RIGHTSOS_ENFORCE_CARE === "true",
  enforceJobs: process.env.MAPABLE_RIGHTSOS_ENFORCE_JOBS === "true",
  enforceAccess: process.env.MAPABLE_RIGHTSOS_ENFORCE_ACCESS === "true",
  enforceHome: process.env.MAPABLE_RIGHTSOS_ENFORCE_HOME === "true",
  enforcePartners: process.env.MAPABLE_RIGHTSOS_ENFORCE_PARTNERS === "true",
  emergencyOverrideEnabled:
    process.env.MAPABLE_RIGHTSOS_EMERGENCY_OVERRIDE_ENABLED === "true",
};

export function isRightsOsEnabled() {
  return rightsOsConfig.enabled;
}

export function isPurposeFirewallEnabled() {
  return rightsOsConfig.enabled && rightsOsConfig.purposeFirewallEnabled;
}

export function isShadowMode() {
  return rightsOsConfig.mode === "shadow" || !rightsOsConfig.purposeFirewallEnabled;
}

export function shouldEnforcePurpose(programme: string): boolean {
  if (isShadowMode()) return false;
  switch (programme) {
    case "transport":
      return rightsOsConfig.enforceTransport;
    case "care":
      return rightsOsConfig.enforceCare;
    case "jobs":
      return rightsOsConfig.enforceJobs;
    case "access":
      return rightsOsConfig.enforceAccess;
    case "home":
      return rightsOsConfig.enforceHome;
    case "partners":
      return rightsOsConfig.enforcePartners;
    default:
      return false;
  }
}

export function isRightsCentreEnabled() {
  return rightsOsConfig.enabled && rightsOsConfig.rightsCentreEnabled;
}

export function isDecisionRoomEnabled() {
  return rightsOsConfig.enabled && rightsOsConfig.decisionRoomEnabled;
}

export function isAccessCapsulesEnabled() {
  return rightsOsConfig.enabled && rightsOsConfig.accessCapsulesEnabled;
}

export function isPersonalVaultEnabled() {
  return rightsOsConfig.enabled && rightsOsConfig.personalAccessVaultEnabled;
}

export function isRecipientDutiesEnabled() {
  return rightsOsConfig.enabled && rightsOsConfig.recipientDutiesEnabled;
}

export function isRightsLedgerEnabled() {
  return rightsOsConfig.enabled && rightsOsConfig.rightsLedgerEnabled;
}
