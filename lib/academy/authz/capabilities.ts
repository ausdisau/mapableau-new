import type { CurrentUser } from "@/lib/auth/current-user";
import {
  hasPermission,
  type Permission,
} from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

import {
  type AcademyEntitlement,
  getAcademyConfig,
} from "@/lib/academy/config";

export class AcademyAuthzError extends Error {
  constructor(
    message: string,
    public readonly status: 401 | 403 = 403,
  ) {
    super(message);
    this.name = "AcademyAuthzError";
  }
}

/** Platform permission → mapable role matrix for Academy MVP. */
export function hasAcademyPlatformPermission(
  user: CurrentUser,
  permission: Permission,
): boolean {
  return hasPermission(user.primaryRole, permission);
}

export async function listUserAcademyEntitlements(
  userId: string,
): Promise<Set<AcademyEntitlement>> {
  const memberships = await prisma.academyMembership.findMany({
    where: { userId, status: "active" },
    select: { entitlements: true },
  });
  const set = new Set<AcademyEntitlement>();
  for (const m of memberships) {
    for (const e of m.entitlements) {
      set.add(e as AcademyEntitlement);
    }
  }
  return set;
}

/**
 * Capability check: platform Permission OR AcademyMembership entitlement.
 * UI hiding is not authorization — call this on every server path.
 */
export async function assertAcademyCapability(
  user: CurrentUser,
  opts: {
    permission?: Permission;
    entitlement?: AcademyEntitlement;
    anyEntitlement?: AcademyEntitlement[];
  },
): Promise<void> {
  const config = getAcademyConfig();
  if (!config.enabled) {
    throw new AcademyAuthzError("MapAble Academy is not enabled", 403);
  }

  if (opts.permission && hasAcademyPlatformPermission(user, opts.permission)) {
    return;
  }

  const entitlements = await listUserAcademyEntitlements(user.id);
  if (opts.entitlement && entitlements.has(opts.entitlement)) return;
  if (opts.anyEntitlement?.some((e) => entitlements.has(e))) return;

  // mapable_admin with academy:admin platform permission cover-all via permission check above
  if (hasAcademyPlatformPermission(user, "academy:admin")) return;

  throw new AcademyAuthzError("You do not have permission for this Academy action");
}

export async function assertOwnsEnrolment(
  user: CurrentUser,
  enrolmentId: string,
): Promise<void> {
  const enrolment = await prisma.academyEnrolment.findUnique({
    where: { id: enrolmentId },
    select: { userId: true },
  });
  if (!enrolment) throw new AcademyAuthzError("Enrolment not found", 403);
  if (enrolment.userId !== user.id) {
    // Provider org visibility is handled separately
    if (!hasAcademyPlatformPermission(user, "academy:admin")) {
      throw new AcademyAuthzError("You can only access your own enrolments");
    }
  }
}

export async function isCurrentOrgMember(
  organisationId: string,
  userId: string,
): Promise<boolean> {
  const member = await prisma.organisationMember.findUnique({
    where: {
      userId_organisationId: { userId, organisationId },
    },
  });
  return Boolean(member);
}
