import type { AdType, AdSearchContext, SponsoredAdResult } from "@/types/ads";

import {
  getCampaignFatiguePenalty,
  getCampaignReportPenalty,
  isCampaignHiddenByUser,
} from "@/lib/ads/ad-event-service";
import {
  allRulesMatchContext,
  buildTargetingSummary,
  computeAccessMatch,
  computeContextRelevance,
  computeLocationRelevance,
  type TargetingRuleRecord,
} from "@/lib/ads/ad-targeting-service";
import { prisma } from "@/lib/prisma";
import { isProviderEligibleForMatching } from "@/lib/provider-verification/verification-case-service";

const PROVIDER_AD_TYPES: AdType[] = [
  "sponsored_provider_pin",
  "sponsored_provider_card",
];

export function isProviderAdType(adType: AdType): boolean {
  return PROVIDER_AD_TYPES.includes(adType);
}

function isWithinSchedule(startsAt: Date | null, endsAt: Date | null): boolean {
  const now = new Date();
  if (startsAt && now < startsAt) return false;
  if (endsAt && now > endsAt) return false;
  return true;
}

function hasBudgetRemaining(spent: number, total: number): boolean {
  if (total <= 0) return true;
  return spent < total;
}

async function verifyProviderCampaign(
  organisationId: string,
  adType: AdType,
): Promise<boolean> {
  if (!isProviderAdType(adType)) return true;
  const org = await prisma.organisation.findUnique({
    where: { id: organisationId },
    select: { verificationStatus: true, status: true },
  });
  if (!org) return false;
  return isProviderEligibleForMatching(org.verificationStatus, org.status);
}

async function rankCampaign(
  campaign: {
    id: string;
    adType: AdType;
    bidAmountCents: number;
    organisationId: string;
    creatives: Array<{
      id: string;
      headline: string;
      description: string | null;
      ctaLabel: string | null;
      ctaUrl: string | null;
      providerOutletKey: string | null;
      providerProfileId: string | null;
      latitude: number | null;
      longitude: number | null;
      imageUrl: string | null;
    }>;
    targetingRules: TargetingRuleRecord[];
  },
  context: AdSearchContext,
  sessionToken?: string,
): Promise<SponsoredAdResult | null> {
  const creative = campaign.creatives.find((c) => c.headline) ?? campaign.creatives[0];
  if (!creative) return null;

  const relevance = computeContextRelevance(campaign.targetingRules, context);
  const accessMatch = computeAccessMatch(campaign.targetingRules, context);
  const locationMatch = computeLocationRelevance(
    creative.latitude,
    creative.longitude,
    context,
  );

  const fatigue = await getCampaignFatiguePenalty(campaign.id, sessionToken);
  const reportPenalty = await getCampaignReportPenalty(campaign.id);

  const bidScore = Math.min(campaign.bidAmountCents / 1000, 1);
  const score =
    relevance * 0.35 +
    accessMatch * 0.2 +
    locationMatch * 0.2 +
    bidScore * 0.15 -
    fatigue -
    reportPenalty;

  const verificationPassed = await verifyProviderCampaign(
    campaign.organisationId,
    campaign.adType,
  );
  if (isProviderAdType(campaign.adType) && !verificationPassed) return null;

  return {
    campaignId: campaign.id,
    creativeId: creative.id,
    adType: campaign.adType,
    headline: creative.headline,
    description: creative.description,
    ctaLabel: creative.ctaLabel,
    ctaUrl: creative.ctaUrl,
    providerOutletKey: creative.providerOutletKey,
    providerProfileId: creative.providerProfileId,
    latitude: creative.latitude,
    longitude: creative.longitude,
    imageUrl: creative.imageUrl,
    isSponsored: true,
    relevanceScore: Math.max(0, score),
    targetingSummary: buildTargetingSummary(campaign.targetingRules),
    verificationPassed,
  };
}

export async function selectAdsForContext(
  context: AdSearchContext,
  limit = 5,
): Promise<SponsoredAdResult[]> {
  const adTypes = context.adTypes ?? [];
  const now = new Date();

  const campaigns = await prisma.adCampaign.findMany({
    where: {
      status: "active",
      reviewStatus: "approved",
      adType: adTypes.length > 0 ? { in: adTypes } : undefined,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
    },
    include: {
      creatives: { where: { isActive: true } },
      targetingRules: true,
      organisation: { select: { verificationStatus: true, status: true } },
    },
  });

  const eligible: SponsoredAdResult[] = [];

  for (const campaign of campaigns) {
    if (!isWithinSchedule(campaign.startsAt, campaign.endsAt)) continue;
    if (!hasBudgetRemaining(campaign.spentBudgetCents, campaign.totalBudgetCents)) {
      continue;
    }

    const rules: TargetingRuleRecord[] = campaign.targetingRules.map((r) => ({
      ruleKind: r.ruleKind,
      ruleValue: r.ruleValue as Record<string, unknown>,
    }));

    if (!allRulesMatchContext(rules, context)) continue;

    const hidden = await isCampaignHiddenByUser(
      campaign.id,
      context.sessionToken,
      context.userId,
    );
    if (hidden) continue;

    if (
      isProviderAdType(campaign.adType) &&
      !isProviderEligibleForMatching(
        campaign.organisation.verificationStatus,
        campaign.organisation.status,
      )
    ) {
      continue;
    }

    const ranked = await rankCampaign(
      {
        id: campaign.id,
        adType: campaign.adType,
        bidAmountCents: campaign.bidAmountCents,
        organisationId: campaign.organisationId,
        creatives: campaign.creatives,
        targetingRules: rules,
      },
      context,
      context.sessionToken,
    );

    if (ranked) eligible.push(ranked);
  }

  return eligible
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);
}

export const OSM_ATTRIBUTION_NOTE =
  "Map data © OpenStreetMap contributors. Sponsored listings are separate overlays and do not modify OpenStreetMap data.";
