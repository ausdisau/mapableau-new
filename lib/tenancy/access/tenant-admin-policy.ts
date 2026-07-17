import type { CurrentUser } from "@/lib/auth/current-user";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { hasPermission, type Permission } from "@/lib/auth/permissions";

/**
 * Tenant admin (e.g. provider_admin) can only administer organisations they
 * are a member of. Platform admin still requires an explicit organisationId
 * scope to fall under this policy — ambient admin is denied by design.
 */
export async function assertTenantAdmin(
  user: CurrentUser,
  organisationId: string,
  permission: Permission = "tenant:admin:manage"
): Promise<void> {
  if (!hasPermission(user.primaryRole, permission)) {
    throw new Error("TENANT_ADMIN_PERMISSION_DENIED");
  }
  if (user.primaryRole === "mapable_admin") return;
  const orgIds = await getUserOrganisationIds(user.id);
  if (!orgIds.includes(organisationId)) {
    throw new Error("TENANT_ADMIN_NOT_A_MEMBER");
  }
}

export async function tenantAdminOrganisationsForUser(
  user: CurrentUser
): Promise<string[]> {
  return getUserOrganisationIds(user.id);
}
