import type { PolicyDecision } from "../types";

export function evaluateStatusPolicy(policyPresent: boolean): PolicyDecision {
  return policyPresent
    ? { allowed: true, reason: "policy_present" }
    : { allowed: false, reason: "missing_policy_denied" };
}
