/** Env-driven flags for the Quality & Safeguards Ops Centre. */

export function isQualitySafeguardsOpsEnabled(): boolean {
  return process.env.QUALITY_SAFEGUARDS_OPS_ENABLED !== "false";
}

export function isBehaviourSupportGovernanceEnabled(): boolean {
  return process.env.FEATURE_BEHAVIOUR_SUPPORT_GOVERNANCE === "true";
}

export function isQualityCopilotEnabled(): boolean {
  return process.env.QUALITY_COPILOT_ENABLED === "true";
}
