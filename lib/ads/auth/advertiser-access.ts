import {
  assertOrganisationAccess,
  OrganisationAccessError,
} from "@/lib/api/organisation-scope";
import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export async function requireAdvertiserAccess(
  user: CurrentUser,
  advertiserId: string,
): Promise<{ advertiserId: string; organisationId: string | null }> {
  const advertiser = await prisma.adAdvertiser.findUnique({
    where: { id: advertiserId },
  });
  if (!advertiser) {
    throw new OrganisationAccessError("Advertiser not found");
  }
  if (isAdminRole(user.primaryRole)) {
    return {
      advertiserId: advertiser.id,
      organisationId: advertiser.organisationId,
    };
  }
  if (!advertiser.organisationId) {
    throw new OrganisationAccessError();
  }
  await assertOrganisationAccess(
    user,
    advertiser.organisationId,
    "care:manage:org",
  );
  return {
    advertiserId: advertiser.id,
    organisationId: advertiser.organisationId,
  };
}

export async function listAdvertisersForUser(user: CurrentUser) {
  if (isAdminRole(user.primaryRole)) {
    return prisma.adAdvertiser.findMany({
      orderBy: { name: "asc" },
      take: 100,
    });
  }
  const memberships = await prisma.organisationMember.findMany({
    where: { userId: user.id },
    select: { organisationId: true },
  });
  const orgIds = memberships.map((m) => m.organisationId);
  if (orgIds.length === 0) return [];
  return prisma.adAdvertiser.findMany({
    where: { organisationId: { in: orgIds } },
    orderBy: { name: "asc" },
  });
}
