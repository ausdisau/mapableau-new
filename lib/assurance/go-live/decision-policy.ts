import type {
  AssuranceReadinessDecision,
  ProductionGoLiveDecision,
} from "@prisma/client";

export type GoLivePolicyInput = {
  featureFlagsSatisfied: boolean;
  assuranceDecision: AssuranceReadinessDecision;
  registrationSatisfied: boolean;
  ndiaPartnershipSatisfied: boolean;
  workerTrustSatisfied: boolean;
  rollbackPlanDocumented: boolean;
};

export type GoLivePolicyResult = {
  decision: ProductionGoLiveDecision;
  blockingReasons: string[];
};

/**
 * Feature flags alone never pass go-live.
 */
export function evaluateGoLiveDecision(
  input: GoLivePolicyInput
): GoLivePolicyResult {
  const blockingReasons: string[] = [];

  if (!input.assuranceDecision || input.assuranceDecision === "blocked") {
    blockingReasons.push("assurance_blocked");
  }
  if (
    input.assuranceDecision === "not_ready" ||
    input.assuranceDecision === "conditionally_ready"
  ) {
    blockingReasons.push("assurance_not_ready");
  }
  if (!input.registrationSatisfied) {
    blockingReasons.push("registration_not_satisfied");
  }
  if (!input.ndiaPartnershipSatisfied) {
    blockingReasons.push("ndia_partnership_not_satisfied");
  }
  if (!input.workerTrustSatisfied) {
    blockingReasons.push("worker_trust_not_satisfied");
  }
  if (!input.rollbackPlanDocumented) {
    blockingReasons.push("rollback_plan_missing");
  }

  // Explicitly ignore featureFlagsSatisfied as a pass condition.
  if (input.featureFlagsSatisfied && blockingReasons.length > 0) {
    blockingReasons.push("feature_flags_do_not_equal_go_live");
  }

  if (blockingReasons.length > 0) {
    return { decision: "blocked", blockingReasons };
  }

  if (input.assuranceDecision === "ready_for_controlled_pilot") {
    return { decision: "approved_for_pilot", blockingReasons: [] };
  }

  return { decision: "conditionally_approved", blockingReasons: [] };
}
