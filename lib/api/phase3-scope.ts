import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export async function getUserOrganisationIds(userId: string): Promise<string[]> {
  const memberships = await prisma.organisationMember.findMany({
    where: { userId },
    select: { organisationId: true },
  });
  return memberships.map((m) => m.organisationId);
}

export function participantCareWhere(user: CurrentUser) {
  if (isAdminRole(user.primaryRole)) return {};
  return { participantId: user.id };
}

export async function providerCareWhere(user: CurrentUser) {
  if (isAdminRole(user.primaryRole)) return {};
  const orgIds = await getUserOrganisationIds(user.id);
  return { assignedOrganisationId: { in: orgIds } };
}

export function participantTransportWhere(user: CurrentUser) {
  if (isAdminRole(user.primaryRole)) return {};
  return { participantId: user.id };
}

export async function providerTransportWhere(user: CurrentUser) {
  if (isAdminRole(user.primaryRole)) return {};
  const orgIds = await getUserOrganisationIds(user.id);
  return { operatorOrganisationId: { in: orgIds } };
}

export async function driverTransportWhere(user: CurrentUser) {
  if (isAdminRole(user.primaryRole)) return {};
  const profile = await prisma.driverProfile.findFirst({
    where: { userId: user.id, active: true },
    select: { id: true },
  });
  if (!profile) return { id: "__none__" };
  return { driverProfileId: profile.id };
}
