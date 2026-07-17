import { prisma } from "@/lib/prisma";
import type { TenantContext } from "@/lib/tenancy/context/tenant-context";
import { assertTenantScoped } from "@/lib/tenancy/context/tenant-assertions";

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/**
 * Runs work inside a Prisma transaction bound to a tenant context. If the
 * context is not tenant-scoped, this fails closed BEFORE opening the tx.
 */
export async function withTenantTransaction<T>(
  ctx: TenantContext,
  fn: (tx: Tx, tenantId: string) => Promise<T>
): Promise<T> {
  assertTenantScoped(ctx);
  const tenantId = ctx.organisationId!;
  return prisma.$transaction(async (tx) => fn(tx, tenantId));
}
