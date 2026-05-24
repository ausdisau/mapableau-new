import type { MapAbleUserRole } from "@prisma/client";

import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { prisma } from "@/lib/prisma";

const PROVIDER_ROLES: MapAbleUserRole[] = [
  "provider_admin",
  "transport_operator",
];

export type ProviderAccessResult = {
  organisationId: string;
  viewAsAdmin: boolean;
};

export function isProviderPortalRole(role: MapAbleUserRole): boolean {
  return PROVIDER_ROLES.includes(role);
}

export async function resolveProviderAccess(
  actor: CurrentUser,
  organisationIdParam?: string | null,
): Promise<ProviderAccessResult | null> {
  const requestedId = organisationIdParam?.trim();

  if (requestedId) {
    if (isAdminRole(actor.primaryRole)) {
      const org = await prisma.organisation.findUnique({
        where: { id: requestedId },
        select: { id: true },
      });
      if (!org) return null;
      return { organisationId: requestedId, viewAsAdmin: true };
    }
    const orgIds = await getUserOrganisationIds(actor.id);
    if (!orgIds.includes(requestedId)) return null;
    return { organisationId: requestedId, viewAsAdmin: false };
  }

  const role = actor.primaryRole as MapAbleUserRole;
  if (
    isProviderPortalRole(role) ||
    actor.roles.some((r) => isProviderPortalRole(r as MapAbleUserRole))
  ) {
    const orgIds = await getUserOrganisationIds(actor.id);
    if (orgIds.length === 0) return null;
    return { organisationId: orgIds[0]!, viewAsAdmin: false };
  }

  if (isAdminRole(role)) {
    return null;
  }

  return null;
}

export async function ensureProviderOrganisation(
  userId: string,
  displayName: string | null,
): Promise<string> {
  const existing = await getUserOrganisationIds(userId);
  if (existing.length > 0) return existing[0]!;

  const org = await prisma.organisation.create({
    data: {
      name: displayName?.trim() || "My organisation",
      organisationType: "care_provider",
      contactEmail: undefined,
      members: {
        create: {
          userId,
          role: "provider_admin",
        },
      },
    },
    select: { id: true },
  });

  return org.id;
}
