export interface CareIntelligenceConfig {
  enabled: boolean;
  sandbox: boolean;
  syntheticOnly: boolean;
  realWorldExecutionEnabled: boolean;
  externalMessagingEnabled: boolean;
  externalModelsEnabled: boolean;
  persistentMemoryEnabled: boolean;
  maxCycles: 3;
  maxPlans: 3;
  autonomyCeiling: 3;
}

export class CareIntelligenceConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CareIntelligenceConfigurationError";
  }
}

const exactTrue = (value: string | undefined) => value === "true";

export function careIntelligenceConfigFromEnv(
  env: Readonly<Record<string, string | undefined>> = process.env,
): CareIntelligenceConfig {
  return {
    enabled: exactTrue(env.MAPABLE_AUTONOMOUS_COORDINATION_ENABLED),
    sandbox: exactTrue(env.MAPABLE_AUTONOMOUS_COORDINATION_SANDBOX),
    syntheticOnly: exactTrue(
      env.MAPABLE_AUTONOMOUS_COORDINATION_SYNTHETIC_ONLY,
    ),
    realWorldExecutionEnabled: exactTrue(
      env.MAPABLE_AUTONOMOUS_COORDINATION_REAL_WORLD_EXECUTION,
    ),
    externalMessagingEnabled: exactTrue(
      env.MAPABLE_AUTONOMOUS_COORDINATION_EXTERNAL_MESSAGING,
    ),
    externalModelsEnabled: exactTrue(
      env.MAPABLE_AUTONOMOUS_COORDINATION_EXTERNAL_MODELS,
    ),
    persistentMemoryEnabled: exactTrue(
      env.MAPABLE_AUTONOMOUS_COORDINATION_PERSISTENT_MEMORY,
    ),
    maxCycles: 3,
    maxPlans: 3,
    autonomyCeiling: 3,
  };
}

export const SYNTHETIC_CSI_CONFIG: CareIntelligenceConfig = Object.freeze({
  enabled: true,
  sandbox: true,
  syntheticOnly: true,
  realWorldExecutionEnabled: false,
  externalMessagingEnabled: false,
  externalModelsEnabled: false,
  persistentMemoryEnabled: false,
  maxCycles: 3,
  maxPlans: 3,
  autonomyCeiling: 3,
});

export function assertSyntheticBoundary(config: CareIntelligenceConfig): void {
  if (!config.enabled)
    throw new CareIntelligenceConfigurationError("CSI_DISABLED");
  if (!config.sandbox || !config.syntheticOnly)
    throw new CareIntelligenceConfigurationError("SYNTHETIC_SANDBOX_REQUIRED");
  if (config.realWorldExecutionEnabled)
    throw new CareIntelligenceConfigurationError(
      "REAL_WORLD_EXECUTION_PROHIBITED",
    );
  if (config.externalMessagingEnabled)
    throw new CareIntelligenceConfigurationError(
      "EXTERNAL_MESSAGING_PROHIBITED",
    );
  if (config.externalModelsEnabled)
    throw new CareIntelligenceConfigurationError("EXTERNAL_MODELS_PROHIBITED");
  if (config.persistentMemoryEnabled)
    throw new CareIntelligenceConfigurationError(
      "PERSISTENT_MEMORY_PROHIBITED",
    );
  if (config.maxCycles > 3 || config.maxPlans > 3 || config.autonomyCeiling > 3)
    throw new CareIntelligenceConfigurationError("AUTONOMY_BOUNDARY_EXCEEDED");
}

export function careIntelligenceHealth(config: CareIntelligenceConfig) {
  try {
    assertSyntheticBoundary(config);
    return {
      status: "ready" as const,
      mode: "synthetic_deliberation" as const,
      enabled: true,
      autonomyCeiling: config.autonomyCeiling,
      specialistAgents: 5,
      realWorldExecutionEnabled: false,
      externalModelsEnabled: false,
      persistentMemoryEnabled: false,
    };
  } catch (error) {
    return {
      status: config.enabled
        ? ("misconfigured" as const)
        : ("disabled" as const),
      mode: "synthetic_deliberation" as const,
      enabled: config.enabled,
      reason:
        error instanceof CareIntelligenceConfigurationError
          ? error.message
          : "CSI_CONFIGURATION_INVALID",
      autonomyCeiling: config.autonomyCeiling,
      specialistAgents: 5,
      realWorldExecutionEnabled: config.realWorldExecutionEnabled,
      externalModelsEnabled: config.externalModelsEnabled,
      persistentMemoryEnabled: config.persistentMemoryEnabled,
    };
  }
}
