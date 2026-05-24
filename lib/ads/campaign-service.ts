import type { CreateAdCampaignInput, UpdateAdCampaignInput } from "@/types/ads";

import { assertSafeTargetingPayload } from "@/lib/ads/ad-targeting-service";
import { submitCampaignForReview } from "@/lib/ads/ad-review-service";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

async function getOrCreateAdvertiserProfile(params: {
  organisationId: string;
  ownerUserId: string;
  displayName: string;
  contactEmail?: string;
}) {
  const existing = await prisma.advertiserProfile.findUnique({
    where: { organisationId: params.organisationId },
  });
  if (existing) return existing;

  return prisma.advertiserProfile.create({
    data: {
      organisationId: params.organisationId,
      ownerUserId: params.ownerUserId,
      displayName: params.displayName,
      contactEmail: params.contactEmail,
    },
  });
}

export async function listProviderCampaigns(organisationIds: string[]) {
  return prisma.adCampaign.findMany({
    where: { organisationId: { in: organisationIds } },
    include: {
      creatives: true,
      targetingRules: true,
      reviewEvents: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function createProviderCampaign(params: {
  organisationId: string;
  createdById: string;
  displayName: string;
  contactEmail?: string;
  input: CreateAdCampaignInput;
  submitForReview?: boolean;
}) {
  for (const rule of params.input.targetingRules) {
    assertSafeTargetingPayload(rule.ruleValue);
  }

  const advertiser = await getOrCreateAdvertiserProfile({
    organisationId: params.organisationId,
    ownerUserId: params.createdById,
    displayName: params.displayName,
    contactEmail: params.contactEmail,
  });

  const campaign = await prisma.adCampaign.create({
    data: {
      advertiserProfileId: advertiser.id,
      organisationId: params.organisationId,
      name: params.input.name,
      adType: params.input.adType,
      dailyBudgetCents: params.input.dailyBudgetCents,
      totalBudgetCents: params.input.totalBudgetCents,
      bidAmountCents: params.input.bidAmountCents,
      startsAt: params.input.startsAt ? new Date(params.input.startsAt) : null,
      endsAt: params.input.endsAt ? new Date(params.input.endsAt) : null,
      createdById: params.createdById,
      status: "draft",
      reviewStatus: "pending",
      creatives: {
        create: {
          headline: params.input.creative.headline,
          description: params.input.creative.description,
          ctaLabel: params.input.creative.ctaLabel,
          ctaUrl: params.input.creative.ctaUrl,
          providerProfileId: params.input.creative.providerProfileId,
          providerOutletKey: params.input.creative.providerOutletKey,
          latitude: params.input.creative.latitude,
          longitude: params.input.creative.longitude,
          imageUrl: params.input.creative.imageUrl,
        },
      },
      targetingRules: {
        create: params.input.targetingRules.map((rule) => ({
          ruleKind: rule.ruleKind,
          ruleValue: rule.ruleValue,
        })),
      },
    },
    include: { creatives: true, targetingRules: true },
  });

  await createAuditEvent({
    actorUserId: params.createdById,
    action: "ad.campaign_created",
    entityType: "AdCampaign",
    entityId: campaign.id,
    organisationId: params.organisationId,
  });

  if (params.submitForReview) {
    await submitCampaignForReview({
      campaignId: campaign.id,
      actorUserId: params.createdById,
    });
  }

  return campaign;
}

export async function updateProviderCampaign(params: {
  campaignId: string;
  organisationIds: string[];
  actorUserId: string;
  input: UpdateAdCampaignInput;
}) {
  const existing = await prisma.adCampaign.findFirst({
    where: {
      id: params.campaignId,
      organisationId: { in: params.organisationIds },
    },
    include: { creatives: true },
  });
  if (!existing) throw new Error("CAMPAIGN_NOT_FOUND");

  if (params.input.targetingRules) {
    for (const rule of params.input.targetingRules) {
      assertSafeTargetingPayload(rule.ruleValue);
    }
  }

  const campaign = await prisma.adCampaign.update({
    where: { id: params.campaignId },
    data: {
      name: params.input.name,
      adType: params.input.adType,
      dailyBudgetCents: params.input.dailyBudgetCents,
      totalBudgetCents: params.input.totalBudgetCents,
      bidAmountCents: params.input.bidAmountCents,
      startsAt: params.input.startsAt ? new Date(params.input.startsAt) : undefined,
      endsAt: params.input.endsAt ? new Date(params.input.endsAt) : undefined,
      status: params.input.status,
      ...(params.input.status === "pending_review"
        ? { reviewStatus: "pending" }
        : {}),
    },
  });

  if (params.input.creative && existing.creatives[0]) {
    await prisma.adCreative.update({
      where: { id: existing.creatives[0].id },
      data: params.input.creative,
    });
  }

  if (params.input.targetingRules) {
    await prisma.adTargetingRule.deleteMany({
      where: { campaignId: params.campaignId },
    });
    await prisma.adTargetingRule.createMany({
      data: params.input.targetingRules.map((rule) => ({
        campaignId: params.campaignId,
        ruleKind: rule.ruleKind,
        ruleValue: rule.ruleValue,
      })),
    });
  }

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "ad.campaign_updated",
    entityType: "AdCampaign",
    entityId: campaign.id,
    organisationId: campaign.organisationId,
  });

  return prisma.adCampaign.findUnique({
    where: { id: params.campaignId },
    include: { creatives: true, targetingRules: true },
  });
}
