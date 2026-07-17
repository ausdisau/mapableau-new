import type { CurrentUser } from "@/lib/auth/current-user";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { prisma } from "@/lib/prisma";

import {
  buildTenantContext,
  type TenantContext,
} from "./tenant-context";

/**
 * Resolves the tenant context for a request from an authenticated user plus
 * an optional explicit `organisationId` (e.g. tenant switcher / query param).
 *
 * Non-admin users can only bind to organisations they are a member of.
 * Platform admin can bind to any organisation, but ONLY if they explicitly
 * name it — no ambient full-read. See `platform-admin-policy.ts`.
 */
export async function resolveTenantContext(
  user: CurrentUser,
  options: {
    requestedOrganisationId?: string | null;
    breakGlassSessionId?: string;
    requestId?: string;
  } = {}
): Promise<TenantContext> {
  const actor = {
    kind: "user" as const,
    userId: user.id,
    role: user.primaryRole,
  };

  const requested = options.requestedOrganisationId ?? null;
  if (!requested) {
    return buildTenantContext({
      organisationId: null,
      actor,
      breakGlassSessionId: options.breakGlassSessionId,
      requestId: options.requestId,
    });
  }

  if (user.primaryRole === "mapable_admin") {
    return buildTenantContext({
      organisationId: requested,
      actor,
      breakGlassSessionId: options.breakGlassSessionId,
      requestId: options.requestId,
    });
  }

  const orgIds = await getUserOrganisationIds(user.id);
  if (!orgIds.includes(requested)) {
    // Never silently upgrade — leave the context tenantless. Callers using
    // platformScopedWhere will fail closed.
    return buildTenantContext({
      organisationId: null,
      actor,
      requestId: options.requestId,
    });
  }

  return buildTenantContext({
    organisationId: requested,
    actor,
    requestId: options.requestId,
  });
}

export async function resolveDefaultTenantForUser(
  user: CurrentUser
): Promise<string | null> {
  if (user.primaryRole === "mapable_admin") return null;
  const first = await prisma.organisationMember.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: { organisationId: true },
  });
  return first?.organisationId ?? null;
}
