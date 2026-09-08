/**
 * MapAble Companion mental-health safety configuration.
 *
 * High-signal pre-model safety routing is a guardrail and is not feature
 * gated. Formal clinical screening is separate and defaults OFF until
 * clinical governance, lived-experience review and an operational response
 * pathway are approved.
 */

function envTrue(key: string): boolean {
  return process.env[key] === "true";
}

export const mentalHealthSafetyFlags = {
  /**
   * Enables presentation/admin wiring for a formal validated screening tool.
   * The current guardrail does not require this flag.
   */
  get formalAsqScreeningEnabled() {
    return envTrue("MAPABLE_MENTAL_HEALTH_ASQ_SCREENING_ENABLED");
  },
};
