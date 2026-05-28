import type { CurrentUser } from "@/lib/auth/current-user";
import {
  hasPermission,
  type Permission,
} from "@/lib/auth/permissions";
import { isAdminRole } from "@/lib/auth/roles";
import type { UserRole } from "@/types/mapable";

export type AccountCentrePersona =
  | "participant"
  | "provider"
  | "worker"
  | "coordinator"
  | "other";

/** True if any assigned role grants the permission (admins bypass). */
export function userHasPermission(
  user: CurrentUser,
  permission: Permission
): boolean {
  if (user.roles.some((r) => isAdminRole(r))) return true;
  return user.roles.some((role) => hasPermission(role, permission));
}

export function getAccountCentrePersona(user: CurrentUser): AccountCentrePersona {
  if (
    user.roles.includes("provider_admin") ||
    user.roles.includes("transport_operator")
  ) {
    return "provider";
  }
  if (
    user.roles.includes("support_worker") ||
    user.roles.includes("driver") ||
    userHasPermission(user, "care:shift:work")
  ) {
    return "worker";
  }
  if (
    user.roles.includes("support_coordinator") ||
    user.roles.includes("plan_manager")
  ) {
    return "coordinator";
  }
  if (
    user.roles.includes("participant") ||
    user.roles.includes("family_member")
  ) {
    return "participant";
  }
  return "other";
}

export function userHasAnyRole(user: CurrentUser, ...roles: UserRole[]): boolean {
  return roles.some((r) => user.roles.includes(r));
}
