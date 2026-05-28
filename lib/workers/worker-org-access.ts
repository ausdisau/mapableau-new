import type { MapAbleUserRole } from "@prisma/client";

import { hasPermission, type Permission } from "@/lib/auth/permissions";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

const OPERATIONAL_WORKER_PERMISSIONS: Permission[] = [
  "care:shift:work",
  "timesheet:manage:org",
];

const ORG_WORKER_MANAGER_ROLES: MapAbleUserRole[] = ["provider_admin"];

/** Shift/timesheet APIs until WorkerProfile is verified. */
export async function canUseOperationalWorkerPermissions(
  userId: string,
  primaryRole: MapAbleUserRole
): Promise<boolean> {
  if (!hasPermission(primaryRole, "care:shift:work")) {
    return false;
  }
  if (primaryRole !== "support_worker") {
    return true;
  }
  const profile = await prisma.workerProfile.findFirst({
    where: { userId, active: true },
    select: { verificationStatus: true },
    orderBy: { createdAt: "asc" },
  });
  return profile?.verificationStatus === "verified";
}

export function isOperationalWorkerPermission(permission: Permission): boolean {
  return OPERATIONAL_WORKER_PERMISSIONS.includes(permission);
}

export async function canManageWorkersInOrganisation(
  userId: string,
  organisationId: string,
  primaryRole: MapAbleUserRole
): Promise<boolean> {
  if (isAdminRole(primaryRole)) return true;
  if (!hasPermission(primaryRole, "worker:manage:org")) return false;

  const membership = await prisma.organisationMember.findFirst({
    where: { userId, organisationId },
    select: { role: true },
  });
  return (
    membership !== null &&
    ORG_WORKER_MANAGER_ROLES.includes(membership.role)
  );
}
