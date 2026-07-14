
function enabled(name: string) {
  return process.env[name] === "true";
}

/**
 * MapAble CareOS native mobile feature flags.
 * All capabilities fail closed unless explicitly enabled.
 */
export const mobileAppConfig = {
  enabled: enabled("MAPABLE_MOBILE_ENABLED"),
  participantEnabled: enabled("MAPABLE_MOBILE_PARTICIPANT_ENABLED"),
  workerEnabled: enabled("MAPABLE_MOBILE_WORKER_ENABLED"),
  coordinatorEnabled: enabled("MAPABLE_MOBILE_COORDINATOR_ENABLED"),
  offlineEnabled: enabled("MAPABLE_MOBILE_OFFLINE_ENABLED"),
  pushEnabled: enabled("MAPABLE_MOBILE_PUSH_ENABLED"),
  voiceEnabled: enabled("MAPABLE_MOBILE_VOICE_ENABLED"),
  aacEnabled: enabled("MAPABLE_MOBILE_AAC_ENABLED"),
  backgroundLocationEnabled: enabled(
    "MAPABLE_MOBILE_BACKGROUND_LOCATION_ENABLED",
  ),
  minimumSupportedVersion:
    process.env.MAPABLE_MOBILE_MINIMUM_SUPPORTED_VERSION?.trim() || "0.1.0",
} as const;

export function ensureMobileEnabled() {
  if (!mobileAppConfig.enabled) {
    throw new Error("MOBILE_DISABLED");
  }
}

export function mobileFeatureFlagPayload() {
  return {
    MAPABLE_MOBILE_ENABLED: mobileAppConfig.enabled,
    MAPABLE_MOBILE_PARTICIPANT_ENABLED: mobileAppConfig.participantEnabled,
    MAPABLE_MOBILE_WORKER_ENABLED: mobileAppConfig.workerEnabled,
    MAPABLE_MOBILE_COORDINATOR_ENABLED: mobileAppConfig.coordinatorEnabled,
    MAPABLE_MOBILE_OFFLINE_ENABLED: mobileAppConfig.offlineEnabled,
    MAPABLE_MOBILE_PUSH_ENABLED: mobileAppConfig.pushEnabled,
    MAPABLE_MOBILE_VOICE_ENABLED: mobileAppConfig.voiceEnabled,
    MAPABLE_MOBILE_AAC_ENABLED: mobileAppConfig.aacEnabled,
    MAPABLE_MOBILE_BACKGROUND_LOCATION_ENABLED:
      mobileAppConfig.backgroundLocationEnabled,
    MAPABLE_AI_ENABLED: process.env.MAPABLE_AI_ENABLED === "true",
    MAPABLE_AI_WRITE_ACTIONS: process.env.MAPABLE_AI_WRITE_ACTIONS === "true",
    MAPABLE_AI_MEMORY_ENABLED: process.env.MAPABLE_AI_MEMORY_ENABLED === "true",
    MAPABLE_PAYMENT_EXECUTION_ENABLED:
      process.env.MAPABLE_PAYMENT_EXECUTION_ENABLED === "true",
    MAPABLE_NDIS_CLAIM_SUBMISSION_ENABLED:
      process.env.MAPABLE_NDIS_CLAIM_SUBMISSION_ENABLED === "true",
    MAPABLE_ROBOTICS_EXECUTION_ENABLED:
      process.env.MAPABLE_ROBOTICS_EXECUTION_ENABLED === "true",
  } as const;
}
