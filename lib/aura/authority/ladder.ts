import { z } from "zod";

/** Explicit authority ladder — deterministic, outside model prompts. */
export const auraAuthorityLevelSchema = z.enum([
  "L0_OBSERVE",
  "L1_EXPLAIN",
  "L2_RECOMMEND",
  "L3_PROPOSE",
  "L4_APPROVED_SERVICE_WRITE",
  "L5_SUPERVISED_EXTERNAL_COORDINATION",
  "L6_PROHIBITED",
]);

export type AuraAuthorityLevel = z.infer<typeof auraAuthorityLevelSchema>;

const RANK: Record<AuraAuthorityLevel, number> = {
  L0_OBSERVE: 0,
  L1_EXPLAIN: 1,
  L2_RECOMMEND: 2,
  L3_PROPOSE: 3,
  L4_APPROVED_SERVICE_WRITE: 4,
  L5_SUPERVISED_EXTERNAL_COORDINATION: 5,
  L6_PROHIBITED: 6,
};

/** Wave 1–2 production ceiling when proposals off. Wave 3 may use L3_PROPOSE. */
export const AURA_WAVE1_AUTHORITY_CEILING: AuraAuthorityLevel = "L2_RECOMMEND";
export const AURA_WAVE3_AUTHORITY_CEILING: AuraAuthorityLevel = "L3_PROPOSE";

export function authorityRank(level: AuraAuthorityLevel): number {
  return RANK[level];
}

export function isAuthorityAtMost(
  level: AuraAuthorityLevel,
  ceiling: AuraAuthorityLevel,
): boolean {
  return RANK[level] <= RANK[ceiling];
}

/**
 * Model cannot raise authority. Returns clamped level.
 */
export function clampAuthority(
  requested: AuraAuthorityLevel,
  ceiling: AuraAuthorityLevel = AURA_WAVE1_AUTHORITY_CEILING,
): AuraAuthorityLevel {
  if (requested === "L6_PROHIBITED") return "L0_OBSERVE";
  if (RANK[requested] > RANK[ceiling]) return ceiling;
  return requested;
}

/** Attempt by model or client to raise authority — always rejected. */
export function rejectAuthorityEscalation(
  current: AuraAuthorityLevel,
  requested: AuraAuthorityLevel,
  ceiling: AuraAuthorityLevel = AURA_WAVE1_AUTHORITY_CEILING,
):
  | { allowed: false; reason: string }
  | { allowed: true; level: AuraAuthorityLevel } {
  if (requested === "L6_PROHIBITED") {
    return {
      allowed: false,
      reason: "L6_PROHIBITED is never a granted level.",
    };
  }
  if (RANK[requested] > RANK[ceiling]) {
    return {
      allowed: false,
      reason: `Requested ${requested} exceeds ceiling ${ceiling}.`,
    };
  }
  if (RANK[requested] > RANK[current] && RANK[requested] > RANK[ceiling]) {
    return { allowed: false, reason: "Model cannot raise authority." };
  }
  if (RANK[requested] > RANK[current]) {
    return {
      allowed: false,
      reason:
        "Authority may only be raised by participant mandate + policy, not by the model.",
    };
  }
  return { allowed: true, level: clampAuthority(requested, ceiling) };
}

export const AURA_PROHIBITED_ACTIONS = [
  "diagnose",
  "prescribe",
  "change_clinical_plans",
  "determine_ndis_eligibility",
  "deny_support",
  "resolve_safeguarding",
  "assign_worker_without_confirmation",
  "reject_employment_applicant",
  "approve_or_release_payment",
  "submit_ndis_claims",
  "disclose_without_authority",
  "control_vehicles",
  "control_wheelchairs",
  "control_hoists",
  "control_medical_devices",
  "control_doors_lifts_building",
  "bypass_safety_systems",
  "modify_own_policy_or_capabilities",
] as const;

export type AuraProhibitedAction = (typeof AURA_PROHIBITED_ACTIONS)[number];

export function isProhibitedAction(action: string): boolean {
  return (AURA_PROHIBITED_ACTIONS as readonly string[]).includes(action);
}
