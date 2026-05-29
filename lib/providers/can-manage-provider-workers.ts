import type { MapAbleUserRole, ProviderRole } from "@prisma/client";

import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

const MANAGER_PROVIDER_ROLES: ProviderRole[] = ["ADMIN", "MANAGER"];

export async function getManageableOrganisationIds(
  userId: string,
  primaryRole: MapAbleUserRole
): Promise<string[]> {
  if (isAdminRole(primaryRole)) {
    const orgs = await prisma.organisation.findMany({
      select: { id: true },
      take: 500,
    });
    return orgs.map((o) => o.id);
  }

  const orgIdSet = new Set<string>();

  const memberships = await prisma.organisationMember.findMany({
    where: { userId, role: "provider_admin" },
    select: { organisationId: true },
  });
  for (const m of memberships) orgIdSet.add(m.organisationId);

  const providerRoles = await prisma.providerUserRole.findMany({
    where: {
      userId,
      role: { in: MANAGER_PROVIDER_ROLES },
    },
    include: { provider: { select: { organisationId: true } } },
  });
  for (const pr of providerRoles) {
    if (pr.provider.organisationId) orgIdSet.add(pr.provider.organisationId);
  }

  if (primaryRole === "provider_admin") {
    const memberOrgs = await getUserOrganisationIds(userId);
    for (const id of memberOrgs) orgIdSet.add(id);
  }

  return [...orgIdSet];
}

export async function canManageProviderWorkers(
  userId: string,
  organisationId: string,
  primaryRole: MapAbleUserRole
): Promise<boolean> {
  if (isAdminRole(primaryRole)) return true;

  const manageable = await getManageableOrganisationIds(userId, primaryRole);
  return manageable.includes(organisationId);
}

export async function canManageProviderById(
  userId: string,
  providerId: string,
  primaryRole: MapAbleUserRole
): Promise<boolean> {
  if (isAdminRole(primaryRole)) return true;

  const providerRole = await prisma.providerUserRole.findUnique({
    where: { userId_providerId: { userId, providerId } },
    select: { role: true },
  });
  if (
    providerRole &&
    MANAGER_PROVIDER_ROLES.includes(providerRole.role)
  ) {
    return true;
  }

  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    select: { organisationId: true },
  });
  if (!provider?.organisationId) return false;

  return canManageProviderWorkers(userId, provider.organisationId, primaryRole);
}
