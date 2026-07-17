import type { TenantContext } from "./tenant-context";

export class TenantBoundaryError extends Error {
  constructor(message = "TENANT_BOUNDARY_DENIED") {
    super(message);
    this.name = "TenantBoundaryError";
  }
}

/** Assert a resource's owning organisation matches the context's tenant. */
export function assertTenantMatch(
  ctx: TenantContext,
  resourceOrganisationId: string
): void {
  if (!ctx.organisationId) {
    throw new TenantBoundaryError("TENANT_CONTEXT_MISSING");
  }
  if (ctx.organisationId !== resourceOrganisationId) {
    throw new TenantBoundaryError("TENANT_MISMATCH");
  }
}

/** Assert that break-glass is in force for cross-tenant reads. */
export function assertBreakGlass(ctx: TenantContext): void {
  if (!ctx.breakGlassSessionId) {
    throw new TenantBoundaryError("BREAK_GLASS_REQUIRED");
  }
}

export function assertTenantScoped(ctx: TenantContext): void {
  if (!ctx.organisationId) {
    throw new TenantBoundaryError("TENANT_CONTEXT_MISSING");
  }
}
