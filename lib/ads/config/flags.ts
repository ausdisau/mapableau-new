/**
 * MapAble Ads feature flags — fail-closed (default false).
 * Production-facing flags must remain false until operational approval.
 */

export type AdsFlagEnv = NodeJS.ProcessEnv | Record<string, string | undefined>;

function envFlag(name: string, env: AdsFlagEnv): boolean {
  return env[name] === "true";
}

export const adsFlagsConfig = {
  isEnabled(env: AdsFlagEnv = process.env): boolean {
    if (envFlag("MAPABLE_ADS_GLOBAL_KILL_SWITCH", env)) return false;
    return envFlag("MAPABLE_ADS_ENABLED", env);
  },
  isAccessEnabled(env: AdsFlagEnv = process.env): boolean {
    return this.isEnabled(env) && envFlag("MAPABLE_ADS_ACCESS_ENABLED", env);
  },
  isProviderFinderEnabled(env: AdsFlagEnv = process.env): boolean {
    return (
      this.isEnabled(env) &&
      envFlag("MAPABLE_ADS_PROVIDER_FINDER_ENABLED", env)
    );
  },
  isInternalEnabled(env: AdsFlagEnv = process.env): boolean {
    return this.isEnabled(env) && envFlag("MAPABLE_ADS_INTERNAL_ENABLED", env);
  },
  isGoogleEnabled(env: AdsFlagEnv = process.env): boolean {
    return this.isEnabled(env) && envFlag("MAPABLE_ADS_GOOGLE_ENABLED", env);
  },
  isEthicalAdsEnabled(env: AdsFlagEnv = process.env): boolean {
    return (
      this.isEnabled(env) && envFlag("MAPABLE_ADS_ETHICALADS_ENABLED", env)
    );
  },
  isMeasurementEnabled(env: AdsFlagEnv = process.env): boolean {
    return (
      this.isEnabled(env) && envFlag("MAPABLE_ADS_MEASUREMENT_ENABLED", env)
    );
  },
  isGlobalKillSwitch(env: AdsFlagEnv = process.env): boolean {
    return envFlag("MAPABLE_ADS_GLOBAL_KILL_SWITCH", env);
  },
  getExternalTimeoutMs(env: AdsFlagEnv = process.env): number {
    const raw = env.MAPABLE_ADS_EXTERNAL_TIMEOUT_MS?.trim();
    const n = raw ? Number.parseInt(raw, 10) : 1500;
    return Number.isFinite(n) && n > 0 ? n : 1500;
  },
  getGoogleNetworkCode(env: AdsFlagEnv = process.env): string | undefined {
    const v = env.GOOGLE_AD_MANAGER_NETWORK_CODE?.trim();
    return v && v.length > 0 ? v : undefined;
  },
  getGoogleAccessMapUnit(env: AdsFlagEnv = process.env): string | undefined {
    const v = env.GOOGLE_AD_MANAGER_ACCESS_MAP_UNIT?.trim();
    return v && v.length > 0 ? v : undefined;
  },
  getGoogleProviderFinderUnit(
    env: AdsFlagEnv = process.env,
  ): string | undefined {
    const v = env.GOOGLE_AD_MANAGER_PROVIDER_FINDER_UNIT?.trim();
    return v && v.length > 0 ? v : undefined;
  },
  getEthicalAdsPublisherId(env: AdsFlagEnv = process.env): string | undefined {
    const v = env.ETHICALADS_PUBLISHER_ID?.trim();
    return v && v.length > 0 ? v : undefined;
  },
};

export function isAdsSurfaceEnabled(
  surface: "access" | "provider_finder",
  env: AdsFlagEnv = process.env,
): boolean {
  if (surface === "access") return adsFlagsConfig.isAccessEnabled(env);
  return adsFlagsConfig.isProviderFinderEnabled(env);
}
