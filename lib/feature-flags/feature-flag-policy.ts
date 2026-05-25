import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";

export const FAIL_CLOSED_MODULE_KEYS = [
  "service_recovery_enabled",
  "quote_marketplace_enabled",
  "provider_quality_signals_enabled",
  "unmet_need_register_enabled",
] as const;

export function canManageFeatureFlags(user: CurrentUser): boolean {
  return isAdminRole(user.primaryRole);
}

export function isFailClosedKey(key: string): boolean {
  return (FAIL_CLOSED_MODULE_KEYS as readonly string[]).includes(key);
}

export function sanitizeFlagForPublic(flag: {
  key: string;
  enabled: boolean;
  killSwitch: boolean;
}): { key: string; enabled: boolean } {
  return { key: flag.key, enabled: flag.enabled && !flag.killSwitch };
}
