import type { MapAbleUserRole, ProviderRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/** Roles that may use provider console / provider-admin surfaces. */
export const PROVIDER_CONSOLE_ORG_ROLES: MapAbleUserRole[] = [
  "provider_admin",
  "support_worker",
  "transport_operator",
  "driver",
];

export function mapOrganisationRoleToProviderRole(
  role: MapAbleUserRole
): ProviderRole {
  switch (role) {
    case "provider_admin":
      return "ADMIN";
    case "transport_operator":
      return "MANAGER";
    case "support_worker":
    case "driver":
    default:
      return "STAFF";
  }
}

export async function userHasProviderConsoleAccess(
  userId: string
): Promise<boolean> {
  const [legacy, orgMember] = await Promise.all([
    prisma.providerUserRole.findFirst({
      where: { userId },
      select: { id: true },
    }),
    prisma.organisationMember.findFirst({
      where: {
        userId,
        role: { in: PROVIDER_CONSOLE_ORG_ROLES },
      },
      select: { id: true },
    }),
  ]);
  return Boolean(legacy ?? orgMember);
}

/**
 * Legacy ProviderUserRole first; otherwise OrganisationMember on the provider's org.
 */
export async function getProviderMembership(
  userId: string,
  providerId: string
) {
  const legacy = await prisma.providerUserRole.findUnique({
    where: { userId_providerId: { userId, providerId } },
    include: { provider: { select: { id: true, name: true } } },
  });
  if (legacy) return legacy;

  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    select: { id: true, name: true, organisationId: true },
  });
  if (!provider?.organisationId) return null;

  const orgMember = await prisma.organisationMember.findUnique({
    where: {
      userId_organisationId: {
        userId,
        organisationId: provider.organisationId,
      },
    },
  });
  if (!orgMember || !PROVIDER_CONSOLE_ORG_ROLES.includes(orgMember.role)) {
    return null;
  }

  return {
    id: `org-member:${orgMember.id}`,
    userId,
    providerId: provider.id,
    role: mapOrganisationRoleToProviderRole(orgMember.role),
    assignedAt: orgMember.createdAt,
    provider: { id: provider.id, name: provider.name },
  };
}

export type ProviderMembershipSummary = {
  providerId: string;
  providerName: string;
  role: ProviderRole;
  organisationId: string | null;
  source: "provider_user_role" | "organisation_member";
};

/** Merged directory memberships for provider-admin picker (legacy + org-linked). */
export async function listProviderMembershipsForUser(
  userId: string
): Promise<ProviderMembershipSummary[]> {
  const [legacyRows, orgRows] = await Promise.all([
    prisma.providerUserRole.findMany({
      where: { userId },
      include: { provider: { select: { id: true, name: true, organisationId: true } } },
      orderBy: { provider: { name: "asc" } },
    }),
    prisma.organisationMember.findMany({
      where: {
        userId,
        role: { in: PROVIDER_CONSOLE_ORG_ROLES },
      },
      include: {
        organisation: {
          select: {
            id: true,
            linkedProviders: {
              select: { id: true, name: true },
              take: 1,
            },
          },
        },
      },
    }),
  ]);

  const byProviderId = new Map<string, ProviderMembershipSummary>();

  for (const m of legacyRows) {
    byProviderId.set(m.provider.id, {
      providerId: m.provider.id,
      providerName: m.provider.name,
      role: m.role,
      organisationId: m.provider.organisationId,
      source: "provider_user_role",
    });
  }

  for (const om of orgRows) {
    const linked = om.organisation.linkedProviders[0];
    if (!linked || byProviderId.has(linked.id)) continue;
    byProviderId.set(linked.id, {
      providerId: linked.id,
      providerName: linked.name,
      role: mapOrganisationRoleToProviderRole(om.role),
      organisationId: om.organisation.id,
      source: "organisation_member",
    });
  }

  return Array.from(byProviderId.values()).sort((a, b) =>
    a.providerName.localeCompare(b.providerName)
  );
}
