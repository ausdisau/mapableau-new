import type { AdAdvertiserCategory } from "@prisma/client";

import { assertOrgAdsAccess } from "@/lib/ads/access";
import { validateAdvertiserCategory } from "@/lib/ads/policy-validation";
import type { CurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

export async function getAdvertiserForOrganisation(organisationId: string) {
  return prisma.adAdvertiser.findUnique({
    where: { organisationId },
    include: { organisation: true, campaigns: { orderBy: { createdAt: "desc" } } },
  });
}

export async function upsertAdvertiser(
  user: CurrentUser,
  input: {
    organisationId: string;
    category: AdAdvertiserCategory;
    contactName?: string;
    contactEmail?: string;
    acceptTerms: boolean;
  }
) {
  const access = await assertOrgAdsAccess(user, input.organisationId);
  if (!access.ok) return { ok: false as const, error: access.error };

  const policy = validateAdvertiserCategory(input.category);
  if (!policy.passed) {
    return { ok: false as const, error: policy.violations.join(" ") };
  }

  if (!input.acceptTerms) {
    return { ok: false as const, error: "You must accept the advertising terms." };
  }

  const org = await prisma.organisation.findUnique({
    where: { id: input.organisationId },
  });
  if (!org) return { ok: false as const, error: "Organisation not found." };

  const onboardingStatus =
    org.verificationStatus === "verified" ? "active" : "pending_verification";

  const advertiser = await prisma.adAdvertiser.upsert({
    where: { organisationId: input.organisationId },
    create: {
      organisationId: input.organisationId,
      category: input.category,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      termsAcceptedAt: new Date(),
      onboardingStatus,
    },
    update: {
      category: input.category,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      termsAcceptedAt: new Date(),
      onboardingStatus,
    },
    include: { organisation: true },
  });

  return { ok: true as const, advertiser };
}

export async function listAdvertisersForUser(userId: string) {
  const orgIds = await prisma.organisationMember.findMany({
    where: { userId },
    select: { organisationId: true },
  });
  return prisma.adAdvertiser.findMany({
    where: {
      organisationId: { in: orgIds.map((o) => o.organisationId) },
    },
    include: {
      organisation: true,
      campaigns: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });
}
