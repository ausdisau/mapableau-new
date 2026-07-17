import { getActiveEntitlement, type EntitlementEnvironment } from "./entitlement-service";
import { isKnownFeatureKey } from "./feature-policy";

function envFlagEnabled(envVar: string): boolean {
  const raw = process.env[envVar];
  if (!raw) return false;
  return raw === "1" || raw.toLowerCase() === "true";
}

/**
 * Runtime gate — the ONLY sanctioned way to check whether a Wave 8 feature is
 * live for a given tenant.
 *
 * ALL of these MUST hold, in this order:
 *  1. Feature key is known.
 *  2. Environment flag is enabled (env var).
 *  3. TenantFeatureEntitlement exists and is active + not expired.
 *  4. (For production environment) tenant has a corresponding GA sign-off — the
 *     caller passes gaApproved so this module remains DB-free.
 *
 * Feature flags / env vars are NOT entitlements. Env alone MUST NOT enable a
 * feature for a tenant.
 */
export interface RuntimeGateInput {
  featureKey: string;
  organisationId: string;
  environment: EntitlementEnvironment;
  /** Env var name whose truthiness gates the feature at boot time. */
  envFlag?: string;
  /** True if a GA assessment for this tenant is approved for this feature/env. */
  gaApproved?: boolean;
}

export interface RuntimeGateResult {
  allowed: boolean;
  reason: string;
}

export async function evaluateRuntimeGate(
  input: RuntimeGateInput
): Promise<RuntimeGateResult> {
  if (!isKnownFeatureKey(input.featureKey)) {
    return { allowed: false, reason: "unknown_feature_key" };
  }
  if (input.envFlag && !envFlagEnabled(input.envFlag)) {
    return { allowed: false, reason: "env_flag_disabled" };
  }
  const entitlement = await getActiveEntitlement({
    organisationId: input.organisationId,
    featureKey: input.featureKey,
    environment: input.environment,
  });
  if (!entitlement) {
    return { allowed: false, reason: "no_active_entitlement" };
  }
  if (input.environment === "production" && !input.gaApproved) {
    return { allowed: false, reason: "production_requires_ga_approval" };
  }
  return { allowed: true, reason: "ok" };
}
