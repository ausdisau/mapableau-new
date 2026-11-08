import type { CurrentUser } from "@/lib/auth/current-user";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import { isAdminRole } from "@/lib/auth/roles";

export function userHasAdsPermission(
  user: CurrentUser,
  permission: Permission,
): boolean {
  if (isAdminRole(user.primaryRole)) return true;
  if (hasPermission(user.primaryRole, permission)) return true;
  return (user.roles ?? []).some((role) => hasPermission(role, permission));
}

export function requireAdsPermission(
  user: CurrentUser,
  permission: Permission,
): void {
  if (!userHasAdsPermission(user, permission)) {
    const error = new Error(`Missing permission ${permission}`);
    (error as Error & { status: number }).status = 403;
    throw error;
  }
}
