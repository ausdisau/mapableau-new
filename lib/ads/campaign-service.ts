import type { AdCampaignStatus, Prisma } from "@prisma/client";

import { assertOrgAdsAccess, getCampaignForOrgUser } from "@/lib/ads/access";
import { getAdsCampaignPackageCents } from "@/lib/ads/config";
import type { AdTargetingInput } from "@/lib/ads/schemas";
import type { CurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

const EDITABLE_STATUSES: AdCampaignStatus[] = ["draft", "rejected"];

export async function listCampaignsForOrganisation(organisationId: string) {
  const advertiser = await prisma.adAdvertiser.findUnique({
    where: { organisationId },
  });
  if (!advertiser) return [];

  return prisma.adCampaign.findMany({
    where: { advertiserId: advertiser.id },
    include: { creatives: true, billingInvoice: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createCampaign(
  user: CurrentUser,
  organisationId: string,
  input: {
    name: string;
    budgetCents?: number;
    targeting: AdTargetingInput;
    startAt?: string;
    endAt?: string;
  }
) {
  const access = await assertOrgAdsAccess(user, organisationId);
  if (!access.ok) return { ok: false as const, error: access.error };

  const advertiser = await prisma.adAdvertiser.findUnique({
    where: { organisationId },
  });
  if (!advertiser) {
    return {
      ok: false as const,
      error: "Complete advertiser onboarding before creating campaigns.",
    };
  }
  if (advertiser.onboardingStatus !== "active") {
    return {
      ok: false as const,
      error: "Advertiser account is not active.",
    };
  }

  const budgetCents = input.budgetCents ?? getAdsCampaignPackageCents();

  const campaign = await prisma.adCampaign.create({
    data: {
      advertiserId: advertiser.id,
      name: input.name,
      budgetCents,
      targeting: input.targeting as Prisma.InputJsonValue,
      startAt: input.startAt ? new Date(input.startAt) : undefined,
      endAt: input.endAt ? new Date(input.endAt) : undefined,
      status: "draft",
    },
    include: { creatives: true },
  });

  return { ok: true as const, campaign };
}

export async function updateCampaign(
  user: CurrentUser,
  campaignId: string,
  input: {
    name?: string;
    budgetCents?: number;
    targeting?: AdTargetingInput;
    startAt?: string | null;
    endAt?: string | null;
  }
) {
  const existing = await getCampaignForOrgUser(campaignId, user.id);
  if (!existing) return { ok: false as const, error: "Campaign not found." };
  if (!EDITABLE_STATUSES.includes(existing.status)) {
    return {
      ok: false as const,
      error: "Only draft or rejected campaigns can be edited.",
    };
  }

  const campaign = await prisma.adCampaign.update({
    where: { id: campaignId },
    data: {
      name: input.name,
      budgetCents: input.budgetCents,
      targeting: input.targeting
        ? (input.targeting as Prisma.InputJsonValue)
        : undefined,
      startAt:
        input.startAt === null
          ? null
          : input.startAt
            ? new Date(input.startAt)
            : undefined,
      endAt:
        input.endAt === null
          ? null
          : input.endAt
            ? new Date(input.endAt)
            : undefined,
    },
    include: { creatives: true, billingInvoice: true },
  });

  return { ok: true as const, campaign };
}

export async function addCreative(
  user: CurrentUser,
  campaignId: string,
  data: Prisma.AdCreativeCreateWithoutCampaignInput
) {
  const existing = await getCampaignForOrgUser(campaignId, user.id);
  if (!existing) return { ok: false as const, error: "Campaign not found." };
  if (!EDITABLE_STATUSES.includes(existing.status)) {
    return {
      ok: false as const,
      error: "Creatives can only be added to draft or rejected campaigns.",
    };
  }

  const creative = await prisma.adCreative.create({
    data: { ...data, campaignId },
  });
  return { ok: true as const, creative };
}

export function isCampaignSchedulable(campaign: {
  status: AdCampaignStatus;
  startAt: Date | null;
  endAt: Date | null;
  billingInvoice: { status: string } | null;
}): boolean {
  if (campaign.status !== "approved" && campaign.status !== "active") {
    return false;
  }
  if (campaign.billingInvoice?.status !== "paid") return false;
  const now = new Date();
  if (campaign.startAt && campaign.startAt > now) return false;
  if (campaign.endAt && campaign.endAt < now) return false;
  return true;
}

export async function activateApprovedCampaigns() {
  const campaigns = await prisma.adCampaign.findMany({
    where: { status: "approved" },
    include: { billingInvoice: true },
  });
  const now = new Date();
  for (const c of campaigns) {
    if (c.billingInvoice?.status !== "paid") continue;
    if (c.startAt && c.startAt > now) continue;
    if (c.endAt && c.endAt < now) {
      await prisma.adCampaign.update({
        where: { id: c.id },
        data: { status: "ended" },
      });
      continue;
    }
    await prisma.adCampaign.update({
      where: { id: c.id },
      data: { status: "active" },
    });
  }
}
