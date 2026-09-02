/**
 * AI Reliability + Observability + Cost Control Plane flags.
 * Fail-closed: when OFF, control-plane recording/dashboard stay inert.
 * Does not expand operational authority or enable model spend.
 */

function envFlag(name: string, defaultEnabled = false): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultEnabled;
  return raw === "true";
}

export const AI_CONTROL_PLANE_FLAG = "MAPABLE_AI_CONTROL_PLANE_ENABLED";

export const aiControlPlaneConfig = {
  /** Master switch for control-plane metrics, tracing helpers, and admin dashboard. */
  get enabled(): boolean {
    return envFlag(AI_CONTROL_PLANE_FLAG, false);
  },
  /** Optional cheaper/local model route when primary budgets or breakers trip. */
  get cheaperFallbackRouteEnabled(): boolean {
    return (
      this.enabled &&
      envFlag("MAPABLE_AI_CONTROL_PLANE_CHEAPER_FALLBACK_ENABLED", false)
    );
  },
};

export function isAiControlPlaneEnabled(): boolean {
  return aiControlPlaneConfig.enabled;
}
