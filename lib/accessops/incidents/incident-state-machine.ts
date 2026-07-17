import type { AccessIncidentState } from "@prisma/client";

const TRANSITIONS: Record<AccessIncidentState, AccessIncidentState[]> = {
  reported: ["validating", "acknowledged", "disputed", "closed"],
  validating: ["acknowledged", "disputed", "closed"],
  acknowledged: ["impact_assessing", "owner_notified", "disputed"],
  impact_assessing: ["owner_notified", "response_planned", "disputed"],
  owner_notified: ["response_planned", "remediation_active"],
  response_planned: ["remediation_active", "monitoring"],
  remediation_active: ["monitoring", "restored_pending_verification"],
  monitoring: ["restored_pending_verification", "disputed"],
  restored_pending_verification: ["restored", "remediation_active", "disputed"],
  restored: ["closed"],
  disputed: ["validating", "closed"],
  closed: ["archived"],
  archived: [],
};

export function canTransitionIncident(
  from: AccessIncidentState,
  to: AccessIncidentState,
): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertIncidentTransition(
  from: AccessIncidentState,
  to: AccessIncidentState,
): void {
  if (!canTransitionIncident(from, to))
    throw new Error(`INVALID_INCIDENT_TRANSITION:${from}:${to}`);
}
