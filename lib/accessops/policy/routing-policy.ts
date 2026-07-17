import type { PolicyDecision } from "../types";

export function evaluateRoutingPolicy(
  policyPresent: boolean,
  restricted: boolean,
): PolicyDecision {
  if (!policyPresent)
    return { allowed: false, reason: "missing_policy_denied" };
  if (restricted) return { allowed: false, reason: "restricted_asset" };
  return { allowed: true, reason: "routing_allowed" };
}
