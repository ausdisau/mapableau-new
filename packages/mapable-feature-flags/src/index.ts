export const MOBILE_FEATURE_FLAG_KEYS = [
  "MAPABLE_MOBILE_ENABLED",
  "MAPABLE_MOBILE_PARTICIPANT_ENABLED",
  "MAPABLE_MOBILE_WORKER_ENABLED",
  "MAPABLE_MOBILE_COORDINATOR_ENABLED",
  "MAPABLE_MOBILE_OFFLINE_ENABLED",
  "MAPABLE_MOBILE_PUSH_ENABLED",
  "MAPABLE_MOBILE_VOICE_ENABLED",
  "MAPABLE_MOBILE_AAC_ENABLED",
  "MAPABLE_MOBILE_BACKGROUND_LOCATION_ENABLED",
  "MAPABLE_AI_ENABLED",
  "MAPABLE_AI_WRITE_ACTIONS",
  "MAPABLE_AI_MEMORY_ENABLED",
  "MAPABLE_PAYMENT_EXECUTION_ENABLED",
  "MAPABLE_NDIS_CLAIM_SUBMISSION_ENABLED",
  "MAPABLE_ROBOTICS_EXECUTION_ENABLED",
] as const;

export type MobileFeatureFlagKey = (typeof MOBILE_FEATURE_FLAG_KEYS)[number];

export type MobileFeatureFlags = Record<MobileFeatureFlagKey, boolean>;

/** Fail-closed defaults for the mobile client bundle. */
export const DEFAULT_MOBILE_FEATURE_FLAGS: MobileFeatureFlags = {
  MAPABLE_MOBILE_ENABLED: true,
  MAPABLE_MOBILE_PARTICIPANT_ENABLED: true,
  MAPABLE_MOBILE_WORKER_ENABLED: false,
  MAPABLE_MOBILE_COORDINATOR_ENABLED: false,
  MAPABLE_MOBILE_OFFLINE_ENABLED: true,
  MAPABLE_MOBILE_PUSH_ENABLED: true,
  MAPABLE_MOBILE_VOICE_ENABLED: false,
  MAPABLE_MOBILE_AAC_ENABLED: true,
  MAPABLE_MOBILE_BACKGROUND_LOCATION_ENABLED: false,
  MAPABLE_AI_ENABLED: true,
  MAPABLE_AI_WRITE_ACTIONS: false,
  MAPABLE_AI_MEMORY_ENABLED: false,
  MAPABLE_PAYMENT_EXECUTION_ENABLED: false,
  MAPABLE_NDIS_CLAIM_SUBMISSION_ENABLED: false,
  MAPABLE_ROBOTICS_EXECUTION_ENABLED: false,
};

export function parseMobileFeatureFlags(
  input: Partial<Record<string, unknown>> | null | undefined,
): MobileFeatureFlags {
  const next = { ...DEFAULT_MOBILE_FEATURE_FLAGS };
  for (const key of MOBILE_FEATURE_FLAG_KEYS) {
    const value = input?.[key];
    if (typeof value === "boolean") {
      next[key] = value;
    } else if (value === "true") {
      next[key] = true;
    } else if (value === "false") {
      next[key] = false;
    }
  }
  return next;
}

export function isModuleVisible(
  flags: MobileFeatureFlags,
  module: "participant" | "worker" | "coordinator",
): boolean {
  if (!flags.MAPABLE_MOBILE_ENABLED) return false;
  if (module === "participant") return flags.MAPABLE_MOBILE_PARTICIPANT_ENABLED;
  if (module === "worker") return flags.MAPABLE_MOBILE_WORKER_ENABLED;
  return flags.MAPABLE_MOBILE_COORDINATOR_ENABLED;
}
