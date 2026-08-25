/**
 * MapAble Agentic Nerve Centre feature flags.
 * Fail-closed: when OFF, existing My MapAble behaviour continues unchanged.
 */

function envFlag(name: string, defaultEnabled = false): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultEnabled;
  return raw === "true";
}

export const AGENTIC_NERVE_CENTRE_FLAG = "MAPABLE_AGENTIC_NERVE_CENTRE_ENABLED";

export const agenticNerveCentreConfig = {
  /** Master switch for Mission Runtime planning surfaces. */
  get enabled(): boolean {
    return envFlag(AGENTIC_NERVE_CENTRE_FLAG, false);
  },
  /** Optional model-assisted domain interpretation (separately gated). */
  get modelAssistedRoutingEnabled(): boolean {
    return (
      this.enabled &&
      envFlag("MAPABLE_AGENTIC_NERVE_CENTRE_MODEL_ASSISTED", false)
    );
  },
};

export function isAgenticNerveCentreEnabled(): boolean {
  return agenticNerveCentreConfig.enabled;
}
