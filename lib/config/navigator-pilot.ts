/** Governed Provider-Search Navigator pilot. All flags default false. */

function envFlag(name: string, defaultEnabled = false): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultEnabled;
  return raw === "true";
}

export const navigatorPilotConfig = {
  /** Master switch for the provider-search Navigator pilot surface. */
  get enabled() {
    return envFlag("MAPABLE_NAVIGATOR_PROVIDER_SEARCH_PILOT", false);
  },
  /** Allow model-backed interpretation inside the pilot (still subject to AI platform kill switches). */
  get modelAssistedEnabled() {
    return envFlag("MAPABLE_NAVIGATOR_PILOT_MODEL_ASSISTED", false);
  },
};

export function isNavigatorProviderSearchPilotEnabled(): boolean {
  return navigatorPilotConfig.enabled;
}

export function assertNavigatorPilotEnabled(): void {
  if (!isNavigatorProviderSearchPilotEnabled()) {
    throw new Error("NAVIGATOR_PILOT_DISABLED");
  }
}
