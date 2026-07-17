import type { PolicyDecision } from "../types";

export function evaluateSensorPolicy(
  policyPresent: boolean,
  productionActivated: boolean,
): PolicyDecision {
  if (!policyPresent)
    return { allowed: false, reason: "missing_policy_denied" };
  if (!productionActivated)
    return { allowed: false, reason: "production_not_activated" };
  return { allowed: true, reason: "sensor_allowed" };
}
