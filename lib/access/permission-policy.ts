import type { CurrentUser } from "@/lib/auth/current-user";
import { hasPermission, type Permission } from "@/lib/auth/permissions";

export function requirePermission(
  user: CurrentUser,
  permission: Permission
): boolean {
  return hasPermission(user.primaryRole, permission);
}
