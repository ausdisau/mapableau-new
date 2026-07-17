import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";

export type AccessibilityOpsCapability =
  | "assets:read"
  | "assets:write"
  | "rules:read"
  | "rules:write"
  | "shadow:evaluate"
  | "runners:ingest"
  | "dashboard:read";

/**
 * Wave 1: platform admins and provider admins may operate the registry.
 * Participant-facing essential info remains out of band (public routes later).
 */
export function hasAccessibilityOpsCapability(
  user: CurrentUser,
  capability: AccessibilityOpsCapability
): boolean {
  if (isAdminRole(user.primaryRole) || user.roles.includes("mapable_admin")) {
    return true;
  }

  const orgOperator =
    user.roles.includes("provider_admin") ||
    user.roles.includes("transport_operator");

  switch (capability) {
    case "assets:read":
    case "rules:read":
    case "dashboard:read":
    case "shadow:evaluate":
      return orgOperator;
    case "assets:write":
    case "rules:write":
      return user.roles.includes("provider_admin");
    case "runners:ingest":
      return false;
    default: {
      const _exhaustive: never = capability;
      return _exhaustive;
    }
  }
}

export function assertAccessibilityOpsCapability(
  user: CurrentUser,
  capability: AccessibilityOpsCapability
): void {
  if (!hasAccessibilityOpsCapability(user, capability)) {
    throw new Error("FORBIDDEN");
  }
}
