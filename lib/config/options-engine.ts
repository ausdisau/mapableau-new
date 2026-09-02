/**
 * Explainable Matching + Options Engine (Prompt 07) — fail-closed feature flags.
 * Engine generates OPTIONS only; never assigns, books, discloses, or decides.
 */

function envFlag(name: string, defaultEnabled = false): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultEnabled;
  return raw === "true";
}

export const OPTIONS_ENGINE_FLAG = "MAPABLE_OPTIONS_ENGINE_ENABLED";
export const OPTIONS_MODEL_EXPLANATION_FLAG =
  "MAPABLE_OPTIONS_MODEL_EXPLANATION_ENABLED";
export const OPTIONS_ENGINE_KILL_SWITCH_FLAG =
  "MAPABLE_OPTIONS_ENGINE_KILL_SWITCH";

export const optionsEngineConfig = {
  get enabled(): boolean {
    return envFlag(OPTIONS_ENGINE_FLAG, false) && !this.killSwitchActive;
  },
  get modelExplanationEnabled(): boolean {
    return this.enabled && envFlag(OPTIONS_MODEL_EXPLANATION_FLAG, false);
  },
  get killSwitchActive(): boolean {
    return envFlag(OPTIONS_ENGINE_KILL_SWITCH_FLAG, false);
  },
};

export function isOptionsEngineEnabled(): boolean {
  return optionsEngineConfig.enabled;
}

export function isOptionsModelExplanationEnabled(): boolean {
  return optionsEngineConfig.modelExplanationEnabled;
}
