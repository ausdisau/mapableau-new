/**
 * Participant Agency Memory + Preference Graph feature flags.
 * Fail-closed: memory surfaces and model context require explicit enablement.
 */

function envFlag(name: string, defaultEnabled = false): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultEnabled;
  return raw === "true";
}

export const AGENCY_MEMORY_FLAG = "MAPABLE_AGENCY_MEMORY_ENABLED";
export const AGENCY_MEMORY_MODEL_CONTEXT_FLAG =
  "MAPABLE_AGENCY_MEMORY_MODEL_CONTEXT_ENABLED";

export const agencyMemoryConfig = {
  get enabled(): boolean {
    return envFlag(AGENCY_MEMORY_FLAG, false);
  },
  /** Scoped Context Fabric injection — never injects the full graph. */
  get modelContextEnabled(): boolean {
    return this.enabled && envFlag(AGENCY_MEMORY_MODEL_CONTEXT_FLAG, false);
  },
};

export function isAgencyMemoryEnabled(): boolean {
  return agencyMemoryConfig.enabled;
}

export function isAgencyMemoryModelContextEnabled(): boolean {
  return agencyMemoryConfig.modelContextEnabled;
}
