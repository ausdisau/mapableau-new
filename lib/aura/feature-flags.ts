/** MapAble AURA feature flags — Wave 5/6/7 slice used on this branch. */

function envTrue(name: string): boolean {
  const v = process.env[name];
  return v === "true" || v === "1";
}

export const auraFlags = {
  /** Master AURA gate — when false, handlers return MAPABLE_AURA_DISABLED. */
  get enabled(): boolean {
    return envTrue("MAPABLE_AURA_ENABLED");
  },
  get pocketEnabled(): boolean {
    return envTrue("MAPABLE_AURA_POCKET_ENABLED");
  },
  get offlineRuntimeEnabled(): boolean {
    return envTrue("MAPABLE_AURA_OFFLINE_RUNTIME_ENABLED");
  },
  get onDeviceAiEnabled(): boolean {
    return envTrue("MAPABLE_AURA_ON_DEVICE_AI_ENABLED");
  },
  get nativeBridgesEnabled(): boolean {
    return envTrue("MAPABLE_AURA_NATIVE_BRIDGES_ENABLED");
  },
  get worldModelEnabled(): boolean {
    return envTrue("MAPABLE_AURA_WORLD_MODEL_ENABLED");
  },
  get journeyGuardianEnabled(): boolean {
    return envTrue("MAPABLE_AURA_JOURNEY_GUARDIAN_ENABLED");
  },
  get sensorThingsEnabled(): boolean {
    return envTrue("MAPABLE_AURA_SENSORTHINGS_ENABLED");
  },
  get waiAdaptEnabled(): boolean {
    return envTrue("MAPABLE_AURA_WAI_ADAPT_ENABLED");
  },
};

/** True when API handlers should return MAPABLE_AURA_DISABLED (403). */
export function isAuraDisabledResponse(): boolean {
  if (process.env.MAPABLE_AURA_DEMO === "true") return false;
  return !auraFlags.enabled;
}
