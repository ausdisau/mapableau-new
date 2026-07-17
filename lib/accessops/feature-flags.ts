import { z } from "zod";

import {
  ACCESSOPS_FEATURE_FLAG_KEYS,
  type AccessOpsFeatureFlagKey,
} from "./types";

const flagValueSchema = z.string().optional();

type EnvReader = Record<string, string | undefined>;

export type AccessOpsFeatureFlags = Record<AccessOpsFeatureFlagKey, boolean>;

function parseFlag(value: string | undefined): boolean {
  const parsed = flagValueSchema.parse(value);
  if (!parsed) return false;
  return parsed === "true" || parsed === "1";
}

export function getAccessOpsFeatureFlags(
  env: EnvReader = process.env,
): AccessOpsFeatureFlags {
  return ACCESSOPS_FEATURE_FLAG_KEYS.reduce<AccessOpsFeatureFlags>(
    (flags, key) => ({ ...flags, [key]: parseFlag(env[key]) }),
    {
      ACCESSOPS_EXTERNAL_FEEDS_ENABLED: false,
      ACCESSOPS_OUTDOOR_PROVIDERS_ENABLED: false,
      ACCESSOPS_OPEN_DATA_EXPORTS_ENABLED: false,
      ACCESSOPS_WEBHOOKS_PRODUCTION_ENABLED: false,
      ACCESSOPS_STATUS_SUBSCRIPTIONS_ENABLED: false,
      ACCESSOPS_SENSOR_FEEDS_ENABLED: false,
      ACCESSOPS_INDOOR_IMPORTS_ENABLED: false,
    },
  );
}

export function isAccessOpsFeatureEnabled(
  key: AccessOpsFeatureFlagKey,
  env: EnvReader = process.env,
): boolean {
  return getAccessOpsFeatureFlags(env)[key];
}
