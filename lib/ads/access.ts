import type { CurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

export async function getUserOrganisationIds(userId: string): Promise<string[]> {
  const memberships = await prisma.organisationMember.findMany({
    where: { userId },
    select: { organisationId: true },
  });
  return memberships.map((m) => m.organisationId);
}

export async function assertOrgAdsAccess(
  user: CurrentUser,
  organisationId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!hasPermission(user.primaryRole, "ads:manage:org")) {
    const anyRole = user.roles.some((r) => hasPermission(r, "ads:manage:org"));
    if (!anyRole) {
      return { ok: false, error: "You do not have permission to manage ads." };
    }
  }

  const member = await prisma.organisationMember.findUnique({
    where: {
      userId_organisationId: { userId: user.id, organisationId },
    },
  });
  if (!member) {
    return { ok: false, error: "You are not a member of this organisation." };
  }

  const org = await prisma.organisation.findUnique({
    where: { id: organisationId },
    select: { verificationStatus: true },
  });
  if (!org) {
    return { ok: false, error: "Organisation not found." };
  }
  if (org.verificationStatus !== "verified") {
    return {
      ok: false,
      error: "Organisation must be verified before advertising.",
    };
  }

  return { ok: true };
}

export async function getCampaignForOrgUser(
  campaignId: string,
  userId: string
) {
  return prisma.adCampaign.findFirst({
    where: {
      id: campaignId,
      advertiser: {
        organisation: {
          members: { some: { userId } },
        },
      },
    },
    include: {
      advertiser: { include: { organisation: true } },
      creatives: true,
      billingInvoice: { include: { fundingSource: true } },
      reviews: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
}
