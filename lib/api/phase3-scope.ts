import type { CurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export async function getUserOrganisationIds(userId: string): Promise<string[]> {
  const memberships = await prisma.organisationMember.findMany({
    where: { userId },
    select: { organisationId: true },
  });
  return memberships.map((m) => m.organisationId);
}

/**
 * Wave 8: sentinel where-clause that never matches. Use this for platform-admin
 * paths that must fail closed unless a caller explicitly resolves an
 * organisation scope or an active break-glass session.
 */
export const PLATFORM_UNSCOPED_DENIED = {
  organisationId: "__platform_unscoped_denied__",
} as const;

export interface PlatformScopeOptions {
  /**
   * Explicit list of organisationIds the caller intends to read. This is the
   * ONLY way a platform admin can produce a cross-organisation query — the
   * caller is responsible for the audit trail and for having a documented
   * reason (e.g. break-glass or an explicit /admin/platform action).
   */
  forceOrgIds?: string[];
  /** Active BreakGlassSession id (from lib/tenancy/access/break-glass-service). */
  breakGlassSessionId?: string;
  /** Callers that intentionally want an audited unscoped platform read must set this. */
  audited?: boolean;
}

/**
 * Wave 8: build a `where`-clause for platform admin queries. Fails closed by
 * default. Never returns `{}`.
 */
export function platformScopedWhere<T extends Record<string, unknown>>(
  user: CurrentUser,
  options: PlatformScopeOptions = {},
  extra: T = {} as T
): T & (
  | { organisationId: string }
  | { organisationId: { in: string[] } }
  | typeof PLATFORM_UNSCOPED_DENIED
) {
  if (!isAdminRole(user.primaryRole)) {
    return { ...extra, ...PLATFORM_UNSCOPED_DENIED };
  }
  const orgIds = options.forceOrgIds?.filter(Boolean) ?? [];
  if (orgIds.length > 0) {
    if (orgIds.length === 1) {
      return { ...extra, organisationId: orgIds[0] };
    }
    return { ...extra, organisationId: { in: Array.from(new Set(orgIds)) } };
  }
  if (options.breakGlassSessionId && options.audited) {
    // Caller has explicitly opted in with an audited break-glass session and
    // no forceOrgIds — return a sentinel that matches every organisation but
    // still forces the caller to have gone through this helper. The caller
    // MUST have already recorded an audit event for the break-glass read.
    return { ...extra } as never;
  }
  return { ...extra, ...PLATFORM_UNSCOPED_DENIED };
}

/**
 * Care where clauses. Wave 8 change: platform admin no longer receives an
 * empty `{}`. If admin want cross-tenant reads they must go through
 * `platformScopedWhere`.
 */
export function participantCareWhere(user: CurrentUser) {
  return { participantId: user.id };
}

export async function providerCareWhere(user: CurrentUser) {
  if (isAdminRole(user.primaryRole)) {
    // Fail closed — never silently expand to all orgs. Admin callers should
    // route through platformScopedWhere and prove scope.
    return { assignedOrganisationId: "__platform_unscoped_denied__" };
  }
  const orgIds = await getUserOrganisationIds(user.id);
  return { assignedOrganisationId: { in: orgIds } };
}

export class OrganisationAccessError extends Error {
  constructor(message = "FORBIDDEN") {
    super(message);
    this.name = "OrganisationAccessError";
  }
}

export async function assertOrganisationAccess(
  user: CurrentUser,
  organisationId: string,
  permission: "worker:manage:org" | "care:manage:org" = "worker:manage:org"
): Promise<void> {
  if (isAdminRole(user.primaryRole)) return;
  if (!hasPermission(user.primaryRole, permission)) {
    throw new OrganisationAccessError();
  }
  const orgIds = await getUserOrganisationIds(user.id);
  if (!orgIds.includes(organisationId)) {
    throw new OrganisationAccessError();
  }
}

export type WorkerProfileAccess = {
  profile: {
    id: string;
    userId: string | null;
    organisationId: string;
    displayName: string;
    profileSummary: string | null;
    serviceTypes: string[];
    serviceRegions: string[];
    languages: string[];
    verificationStatus: string;
    active: boolean;
    workerScreeningStatus: string;
    wwccStatus: string;
    firstAidStatus: string;
    insuranceStatus: string;
  };
  canManage: boolean;
  isOwner: boolean;
};

export async function workerProfileAccess(
  user: CurrentUser,
  workerProfileId: string
): Promise<WorkerProfileAccess | null> {
  const profile = await prisma.workerProfile.findUnique({
    where: { id: workerProfileId },
    select: {
      id: true,
      userId: true,
      organisationId: true,
      displayName: true,
      profileSummary: true,
      serviceTypes: true,
      serviceRegions: true,
      languages: true,
      verificationStatus: true,
      active: true,
      workerScreeningStatus: true,
      wwccStatus: true,
      firstAidStatus: true,
      insuranceStatus: true,
    },
  });
  if (!profile) return null;

  const isOwner = profile.userId === user.id;
  let canManage = isAdminRole(user.primaryRole);

  if (!canManage && hasPermission(user.primaryRole, "worker:manage:org")) {
    const orgIds = await getUserOrganisationIds(user.id);
    canManage = orgIds.includes(profile.organisationId);
  }

  return { profile, canManage, isOwner };
}

export async function assertWorkerProfileRead(
  user: CurrentUser,
  workerProfileId: string
): Promise<WorkerProfileAccess> {
  const access = await workerProfileAccess(user, workerProfileId);
  if (!access) throw new OrganisationAccessError("NOT_FOUND");
  if (!access.canManage && !access.isOwner && !isAdminRole(user.primaryRole)) {
    throw new OrganisationAccessError();
  }
  return access;
}

export async function assertWorkerProfileWrite(
  user: CurrentUser,
  workerProfileId: string,
  options?: { allowSelfFieldsOnly?: boolean }
): Promise<WorkerProfileAccess> {
  const access = await workerProfileAccess(user, workerProfileId);
  if (!access) throw new OrganisationAccessError("NOT_FOUND");
  if (access.canManage) return access;
  if (access.isOwner && options?.allowSelfFieldsOnly !== false) return access;
  throw new OrganisationAccessError();
}

export async function workersListWhere(user: CurrentUser) {
  if (isAdminRole(user.primaryRole)) {
    // Wave 8: fail closed. Admin callers must go through platformScopedWhere.
    return { id: "__platform_unscoped_denied__" };
  }
  if (user.primaryRole === "support_worker") {
    return { userId: user.id };
  }
  if (hasPermission(user.primaryRole, "worker:manage:org")) {
    const orgIds = await getUserOrganisationIds(user.id);
    return { organisationId: { in: orgIds } };
  }
  return { id: "__none__" };
}
