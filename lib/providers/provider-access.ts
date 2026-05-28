import type { MapAbleUserRole, ProviderRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/** Roles that may use provider console / provider-admin surfaces. */
export const PROVIDER_CONSOLE_ORG_ROLES: MapAbleUserRole[] = [
  "provider_admin",
  "support_worker",
  "transport_operator",
  "driver",
];

/**
 * Preferred path for granting provider console access (replaces ProviderUserRole writes).
 */
export async function assignOrganisationProviderAccess(input: {
  userId: string;
  organisationId: string;
  role: MapAbleUserRole;
}) {
  if (!PROVIDER_CONSOLE_ORG_ROLES.includes(input.role)) {
    throw new Error("INVALID_PROVIDER_ORG_ROLE");
  }
  return prisma.organisationMember.upsert({
    where: {
      userId_organisationId: {
        userId: input.userId,
        organisationId: input.organisationId,
      },
    },
    create: {
      userId: input.userId,
      organisationId: input.organisationId,
      role: input.role,
    },
    update: { role: input.role },
  });
}

/** @deprecated Legacy model — do not create new rows outside seed/migration scripts. */
export function assertProviderUserRoleWriteAllowed(context: "seed" | "migration") {
  if (context !== "seed" && context !== "migration") {
    throw new Error(
      "ProviderUserRole is read-only; assign OrganisationMember via assignOrganisationProviderAccess"
    );
  }
}

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
  const orgMember = await prisma.organisationMember.findFirst({
    where: {
      userId,
      role: { in: PROVIDER_CONSOLE_ORG_ROLES },
    },
    select: { id: true },
  });
  if (orgMember) return true;

  const legacy = await prisma.providerUserRole.findFirst({
    where: { userId },
    select: { id: true },
  });
  return Boolean(legacy);
}

/**
 * OrganisationMember on the provider's org is authoritative; legacy ProviderUserRole is read-only fallback.
 */
export async function getProviderMembership(
  userId: string,
  providerId: string
) {
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    select: { id: true, name: true, organisationId: true },
  });
  if (!provider) return null;

  if (provider.organisationId) {
    const orgMember = await prisma.organisationMember.findUnique({
      where: {
        userId_organisationId: {
          userId,
          organisationId: provider.organisationId,
        },
      },
    });
    if (orgMember && PROVIDER_CONSOLE_ORG_ROLES.includes(orgMember.role)) {
      return {
        id: `org-member:${orgMember.id}`,
        userId,
        providerId: provider.id,
        role: mapOrganisationRoleToProviderRole(orgMember.role),
        assignedAt: orgMember.createdAt,
        provider: { id: provider.id, name: provider.name },
      };
    }
  }

  const legacy = await prisma.providerUserRole.findUnique({
    where: { userId_providerId: { userId, providerId } },
    include: { provider: { select: { id: true, name: true } } },
  });
  return legacy;
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
