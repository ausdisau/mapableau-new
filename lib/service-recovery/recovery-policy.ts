import type { ServiceRecoveryTrigger } from "@prisma/client";

const HIGH_RISK_TRIGGERS: ServiceRecoveryTrigger[] = [
  "worker_no_show",
  "participant_reported_issue",
  "service_gap_detected",
];

export function isHighRiskRecovery(trigger: ServiceRecoveryTrigger): boolean {
  return HIGH_RISK_TRIGGERS.includes(trigger);
}

export function requiresHumanConfirmationForAssign(highRisk: boolean): boolean {
  return highRisk;
}
