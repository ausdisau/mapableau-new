/**
 * Release governance feature flags (Prompt 12).
 * Fail-closed: when OFF, readiness enforcement UI and cohort grants stay inert.
 * Does NOT enable pilots or production releases.
 */

function envFlag(name: string, defaultEnabled = false): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultEnabled;
  return raw === "true";
}

/** Master switch for release-governance gates / admin readiness view. */
export const RELEASE_GOVERNANCE_FLAG = "MAPABLE_RELEASE_GOVERNANCE_ENABLED";

export const releaseGovernanceConfig = {
  /**
   * When false (default), readiness enforcement surfaces fail closed and
   * cohort grant/revoke APIs refuse writes. Does not enable any pilot.
   */
  get enabled(): boolean {
    return envFlag(RELEASE_GOVERNANCE_FLAG, false);
  },
};

export function isReleaseGovernanceEnabled(): boolean {
  return releaseGovernanceConfig.enabled;
}
