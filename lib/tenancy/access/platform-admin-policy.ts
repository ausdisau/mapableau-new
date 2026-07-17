import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";

import type { TenantContext } from "../context/tenant-context";
import { hasBreakGlass, hasExplicitTenantScope } from "../context/tenant-context";

/**
 * Central policy: when may a platform admin see cross-organisation data?
 *
 * NEVER by default. Only when either:
 *  - the caller explicitly bound a single `organisationId` to the context; or
 *  - an active `BreakGlassSession` is in force (its id must be on ctx); or
 *  - the caller explicitly requested a known list of orgIds and passed them
 *    to `platformScopedWhere` (audited by the caller).
 */
export interface PlatformAdminReadDecision {
  allowed: boolean;
  reason: string;
  denialCode?: "AMBIENT_ADMIN_DENIED" | "NOT_ADMIN";
}

export function evaluatePlatformAdminRead(
  user: Pick<CurrentUser, "primaryRole">,
  ctx: TenantContext
): PlatformAdminReadDecision {
  if (!isAdminRole(user.primaryRole)) {
    return { allowed: false, reason: "not_platform_admin", denialCode: "NOT_ADMIN" };
  }
  if (hasExplicitTenantScope(ctx)) {
    return { allowed: true, reason: "explicit_tenant_scope" };
  }
  if (hasBreakGlass(ctx)) {
    return { allowed: true, reason: "break_glass_in_force" };
  }
  return {
    allowed: false,
    reason: "ambient_admin_denied",
    denialCode: "AMBIENT_ADMIN_DENIED",
  };
}

/** Convenience wrapper for callers that just want a boolean gate. */
export function platformAdminCanReadCrossTenant(
  user: Pick<CurrentUser, "primaryRole">,
  ctx: TenantContext
): boolean {
  return evaluatePlatformAdminRead(user, ctx).allowed;
}
