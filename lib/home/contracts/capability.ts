/**
 * MapAble Home — vendor-neutral capability model.
 * Claim state: PROPOSED / IN_DEVELOPMENT. No vendor SDK types here.
 */

export const HOME_CAPABILITY_KINDS = [
  "READ_STATE",
  "TURN_ON",
  "TURN_OFF",
  "OPEN",
  "CLOSE",
  "LOCK",
  "UNLOCK",
  "SET_POSITION",
  "SET_LEVEL",
  "SET_TEMPERATURE",
  "SET_COVERING_POSITION",
  "CALL",
  "NOTIFY",
  "SPEAK",
  "REQUEST_ASSISTANCE",
  "REPORT_AVAILABILITY",
  "REPORT_BATTERY",
  "REPORT_CHARGING",
  "REPORT_FAULT",
  "COMMISSION_DEVICE",
  "SHARE_DEVICE",
  "START_ROUTINE",
  "UNKNOWN",
] as const;

export type HomeCapabilityKind = (typeof HOME_CAPABILITY_KINDS)[number];

export const HOME_RISK_CLASSES = [
  "LOW",
  "MODERATE",
  "HIGH",
  "SAFETY_CRITICAL",
] as const;

export type HomeRiskClass = (typeof HOME_RISK_CLASSES)[number];

export const HOME_AUTONOMY_LEVELS = [
  "H0_OBSERVE",
  "H1_SUGGEST",
  "H2_PREPARE",
  "H3_CONFIRM",
  "H4_BOUNDED_AUTO",
  "H5_ROUTINE_ORCHESTRATION",
] as const;

export type HomeAutonomyLevel = (typeof HOME_AUTONOMY_LEVELS)[number];

export type HomeCapability = {
  id: string;
  kind: HomeCapabilityKind;
  displayName: string;
  description: string;
  riskClass: HomeRiskClass;
  minimumAuthorityLevel: HomeAutonomyLevel;
  requiresConfirmation: boolean;
  delegatable: boolean;
  explanationRequired: boolean;
  executableInP0: boolean;
};
