/**
 * Disability-Centric Logic & Memory Fabric.
 *
 * Default OFF. This is an internal-alpha control plane, not evidence that
 * participant memory or cross-service sharing is live in production.
 */
export const dcLmfConfig = {
  enabled:
    process.env.MAPABLE_DC_LMF_ENABLED === "true" &&
    process.env.MAPABLE_TRUST_FABRIC_ENABLED === "true",
  careProjectionEnabled: process.env.MAPABLE_DC_LMF_CARE_ENABLED === "true",
  projectHopeAdapterEnabled:
    process.env.MAPABLE_DC_LMF_PROJECT_HOPE_ENABLED === "true",
  /** Permanent authority ceiling: memory is context, never legal/clinical authority. */
  memoryCanCreateAuthority: false,
  /** Persistent raw health/local-only payloads require a future governed vault reference. */
  rawSensitivePayloadStorageEnabled: false,
  publicClaimState: "internal_alpha" as const,
};

export function isDcLmfEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return (
    env.MAPABLE_DC_LMF_ENABLED === "true" &&
    env.MAPABLE_TRUST_FABRIC_ENABLED === "true"
  );
}

export function isDcLmfCareProjectionEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return isDcLmfEnabled(env) && env.MAPABLE_DC_LMF_CARE_ENABLED === "true";
}

export function isDcLmfProjectHopeAdapterEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return (
    isDcLmfEnabled(env) &&
    env.MAPABLE_DC_LMF_PROJECT_HOPE_ENABLED === "true"
  );
}
