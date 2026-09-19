/** MapAble Sentinel feature flags. All default false (fail closed). */

function envFlag(name: string): boolean {
  return process.env[name] === "true";
}

export const sentinelConfig = {
  get enabled() {
    return envFlag("MAPABLE_SENTINEL_ENABLED");
  },
  get temporalEnabled() {
    return envFlag("MAPABLE_SENTINEL_TEMPORAL_ENABLED");
  },
  get careGatingEnabled() {
    return envFlag("MAPABLE_SENTINEL_CARE_GATING_ENABLED");
  },
  get transportGatingEnabled() {
    return envFlag("MAPABLE_SENTINEL_TRANSPORT_GATING_ENABLED");
  },
  get employmentGatingEnabled() {
    return envFlag("MAPABLE_SENTINEL_EMPLOYMENT_GATING_ENABLED");
  },
  get continuityEnabled() {
    return envFlag("MAPABLE_SENTINEL_CONTINUITY_ENABLED");
  },
  get modelSignalsEnabled() {
    return envFlag("MAPABLE_SENTINEL_MODEL_SIGNALS_ENABLED");
  },
  get killSwitch() {
    return envFlag("MAPABLE_SENTINEL_KILL_SWITCH");
  },
};

export function isSentinelOperational(): boolean {
  return sentinelConfig.enabled && !sentinelConfig.killSwitch;
}

export function isSentinelTemporalAllowed(): boolean {
  return isSentinelOperational() && sentinelConfig.temporalEnabled;
}
