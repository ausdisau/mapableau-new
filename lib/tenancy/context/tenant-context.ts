/**
 * TenantContext — request-scoped, explicit representation of which tenant
 * (Organisation) the current call is acting for.
 *
 * Rules (LOCKED):
 *  - Organisation.id is the tenant security boundary.
 *  - Absence of an organisationId means "no tenant scope" — callers MUST NOT
 *    treat this as "all tenants". Use platformScopedWhere() in phase3-scope.
 *  - Break-glass must be explicit (a persisted BreakGlassSession id).
 */

export type TenantActorKind = "user" | "job" | "system";

export interface TenantContext {
  organisationId: string | null;
  actor: {
    kind: TenantActorKind;
    userId?: string;
    role?: string;
  };
  breakGlassSessionId?: string;
  /** ISO timestamp of context creation, useful for correlating audit logs. */
  createdAt: string;
  /** Correlation id for logs; not sensitive. */
  requestId?: string;
}

export function buildTenantContext(input: {
  organisationId: string | null;
  actor: TenantContext["actor"];
  breakGlassSessionId?: string;
  requestId?: string;
}): TenantContext {
  return {
    organisationId: input.organisationId,
    actor: input.actor,
    breakGlassSessionId: input.breakGlassSessionId,
    createdAt: new Date().toISOString(),
    requestId: input.requestId,
  };
}

export function isPlatformActor(ctx: TenantContext): boolean {
  return ctx.actor.role === "mapable_admin";
}

export function hasExplicitTenantScope(ctx: TenantContext): boolean {
  return Boolean(ctx.organisationId);
}

export function hasBreakGlass(ctx: TenantContext): boolean {
  return Boolean(ctx.breakGlassSessionId);
}
