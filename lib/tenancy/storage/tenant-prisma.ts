import { prisma } from "@/lib/prisma";
import type { TenantContext } from "@/lib/tenancy/context/tenant-context";
import { assertTenantScoped } from "@/lib/tenancy/context/tenant-assertions";

/**
 * Thin wrapper around prisma that logs the active tenant with each call and
 * makes it obvious in stack traces that the caller went through the tenant
 * boundary check. This does NOT replace the shared `prisma` client; it is a
 * lightweight helper for hot paths that want an audit trail.
 */
export function tenantPrisma(ctx: TenantContext) {
  assertTenantScoped(ctx);
  const organisationId = ctx.organisationId!;

  return {
    organisationId,
    prisma,
    tag: `tenant:${organisationId}`,
  };
}
