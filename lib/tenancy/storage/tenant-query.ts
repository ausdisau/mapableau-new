import type { TenantContext } from "@/lib/tenancy/context/tenant-context";
import { assertTenantScoped } from "@/lib/tenancy/context/tenant-assertions";

/**
 * Build a Prisma `where` clause anchored to the caller's tenant. Fails
 * closed when there is no explicit tenant scope. Callers that intentionally
 * want cross-tenant reads must use `platformScopedWhere` in phase3-scope.
 */
export function tenantScopedWhere<T extends Record<string, unknown>>(
  ctx: TenantContext,
  extra: T = {} as T
): T & { organisationId: string } {
  assertTenantScoped(ctx);
  return {
    ...extra,
    organisationId: ctx.organisationId!,
  };
}

export function tenantScopedWhereMany<T extends Record<string, unknown>>(
  ctx: TenantContext,
  additionalOrgIds: string[] = [],
  extra: T = {} as T
): T & { organisationId: { in: string[] } } {
  assertTenantScoped(ctx);
  const ids = Array.from(new Set([ctx.organisationId!, ...additionalOrgIds]));
  return { ...extra, organisationId: { in: ids } };
}
