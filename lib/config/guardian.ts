/** Unified Care & Support Guardian feature flags. All default false (fail closed). */

function envFlag(name: string, defaultEnabled = false): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultEnabled;
  return raw === "true";
}

export const GUARDIAN_FLAG_NAMESPACE = "MAPABLE_GUARDIAN_" as const;

export const guardianConfig = {
  get enabled() {
    return envFlag("MAPABLE_GUARDIAN_ENABLED", false);
  },
  get modelInferenceEnabled() {
    return envFlag("MAPABLE_GUARDIAN_MODEL_INFERENCE_ENABLED", false);
  },
  get externalProcessingEnabled() {
    return envFlag("MAPABLE_GUARDIAN_EXTERNAL_PROCESSING_ENABLED", false);
  },
  get privateInferenceEnabled() {
    return envFlag("MAPABLE_GUARDIAN_PRIVATE_INFERENCE_ENABLED", false);
  },
  get safeguardingSignalsEnabled() {
    return envFlag("MAPABLE_GUARDIAN_SAFEGUARDING_SIGNALS_ENABLED", false);
  },
  get processorRoutingEnabled() {
    return envFlag("MAPABLE_GUARDIAN_PROCESSOR_ROUTING_ENABLED", false);
  },
};

/** Guardian AI-assisted path is operational only when master flag is on. */
export function isGuardianOperational(): boolean {
  return guardianConfig.enabled;
}

export function isGuardianModelInferenceAllowed(): boolean {
  return (
    guardianConfig.enabled && guardianConfig.modelInferenceEnabled
  );
}

export function isGuardianExternalProcessingAllowed(): boolean {
  return (
    guardianConfig.enabled &&
    guardianConfig.processorRoutingEnabled &&
    guardianConfig.externalProcessingEnabled
  );
}

export function isGuardianPrivateInferenceAllowed(): boolean {
  return (
    guardianConfig.enabled &&
    guardianConfig.processorRoutingEnabled &&
    guardianConfig.privateInferenceEnabled
  );
}
