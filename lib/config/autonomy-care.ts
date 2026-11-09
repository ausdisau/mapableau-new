/**
 * Autonomous Care & Support Stage 1 flags.
 * Both default false (`=== "true"` to enable). Not a production autonomy claim.
 */

function envTrue(key: string): boolean {
  return process.env[key] === "true";
}

export const autonomyCareFlags = {
  get exactConsentEnabled() {
    return envTrue("MAPABLE_ACS_EXACT_CONSENT_ENABLED");
  },
  get durableStopEnabled() {
    return envTrue("MAPABLE_ACS_DURABLE_STOP_ENABLED");
  },
};

export function isAcsExactConsentEnabled(): boolean {
  return autonomyCareFlags.exactConsentEnabled;
}

export function isAcsDurableStopEnabled(): boolean {
  return autonomyCareFlags.durableStopEnabled;
}

export const ACS_EXACT_CONSENT_SKIPPED_LOG =
  "[acs] exact-purpose consent gate skipped (MAPABLE_ACS_EXACT_CONSENT_ENABLED is not true)";
