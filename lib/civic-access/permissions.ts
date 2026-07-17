import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";

export type CivicCapability =
  | "assets:read"
  | "assets:write"
  | "sources:read"
  | "sources:write"
  | "projection:read"
  | "pilot:seed"
  | "dashboard:read";

/**
 * Wave 1: platform admins and council/operator org roles may read the registry.
 * Writes are limited to admins and provider/council operators for pilot seed.
 * Participant journey access is explicitly out of scope.
 */
export function hasCivicCapability(
  user: CurrentUser,
  capability: CivicCapability
): boolean {
  if (isAdminRole(user.primaryRole) || user.roles.includes("mapable_admin")) {
    return true;
  }

  const orgReader =
    user.roles.includes("provider_admin") ||
    user.roles.includes("transport_operator") ||
    user.roles.includes("support_coordinator");

  switch (capability) {
    case "assets:read":
    case "sources:read":
    case "projection:read":
    case "dashboard:read":
      return orgReader;
    case "assets:write":
    case "sources:write":
    case "pilot:seed":
      return (
        user.roles.includes("provider_admin") ||
        user.roles.includes("transport_operator")
      );
    default: {
      const _exhaustive: never = capability;
      return _exhaustive;
    }
  }
}

export function assertCivicCapability(
  user: CurrentUser,
  capability: CivicCapability
): void {
  if (!hasCivicCapability(user, capability)) {
    throw new Error("FORBIDDEN");
  }
}
