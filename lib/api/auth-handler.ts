import { getCurrentUser, type CurrentUser } from "@/lib/auth/current-user";
import { apiForbidden, apiUnauthorized } from "@/lib/auth/guards";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import { isAdminRole } from "@/lib/auth/roles";

export async function requireApiSession(): Promise<
  CurrentUser | Response
> {
  const user = await getCurrentUser();
  if (!user) return apiUnauthorized();
  return user;
}

export async function requireApiPermission(
  permission: Permission,
): Promise<CurrentUser | Response> {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!hasPermission(user.primaryRole, permission)) return apiForbidden();
  return user;
}

export async function requireApiAdmin(): Promise<CurrentUser | Response> {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!isAdminRole(user.primaryRole)) return apiForbidden();
  return user;
}

/** Requires platform admin or a specific back-of-house admin permission. */
export async function requireApiAdminScope(
  permission: Permission,
): Promise<CurrentUser | Response> {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!hasPermission(user.primaryRole, permission)) return apiForbidden();
  return user;
}
