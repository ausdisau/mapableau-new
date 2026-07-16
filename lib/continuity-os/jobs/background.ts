/**
 * ContinuityOS background job contracts (Wave 4+).
 * Each job must check: mission stop, participant authority, current state,
 * idempotency, feature flags, and data minimisation.
 *
 * These are not scheduled on main until ContinuityOS is enabled in supervised mode.
 */

export const CONTINUITY_BACKGROUND_JOBS = [
  "upcoming_milestone_review",
  "dependency_freshness",
  "approval_expiry",
  "credential_expiry",
  "unaccepted_handoff",
  "recovery_option_refresh",
  "service_availability_refresh",
  "transport_refresh",
  "equipment_repair_status",
  "regional_capacity_refresh",
  "recovery_timeout",
  "temporary_workaround_expiry",
  "friction_aggregation",
  "commitment_breach",
  "participant_outcome_follow_up",
  "playbook_policy_review",
] as const;

export type ContinuityBackgroundJob = (typeof CONTINUITY_BACKGROUND_JOBS)[number];

export function shouldRunContinuityJob(params: {
  enabled: boolean;
  missionStopped: boolean;
  mode: "demo" | "shadow" | "supervised" | "production";
}): boolean {
  if (!params.enabled) return false;
  if (params.missionStopped) return false;
  // Shadow/demo may refresh projections; must not execute domain writes.
  return true;
}
