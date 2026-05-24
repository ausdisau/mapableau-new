import type { AdPlacement } from "@prisma/client";

import { validateAdCopy, validateTargetingObject } from "@/lib/ads/policy-validation";
import type { AdTargetingInput } from "@/lib/ads/schemas";
import { prisma } from "@/lib/prisma";
import { adCreativePublicUrl } from "@/lib/storage/ad-creatives";

export type ServedAd = {
  campaignId: string;
  creativeId: string;
  placement: AdPlacement;
  headline: string;
  body: string | null;
  ctaLabel: string;
  altText: string;
  landingUrl: string;
  imageUrl: string | null;
  targetOrganisationId: string | null;
  advertiserName: string;
};

export type ServeContext = {
  placement: AdPlacement;
  pageContext?: string;
  serviceCategory?: string;
  state?: string;
  deviceType?: string;
};

function targetingMatches(
  targeting: AdTargetingInput,
  ctx: ServeContext
): boolean {
  if (!targeting.placements.includes(ctx.placement)) return false;

  if (
    targeting.pageContexts?.length &&
    ctx.pageContext &&
    !targeting.pageContexts.some(
      (p) => p.toLowerCase() === ctx.pageContext!.toLowerCase()
    )
  ) {
    return false;
  }
  if (
    targeting.pageContexts?.length &&
    !ctx.pageContext &&
    targeting.pageContexts.length > 0
  ) {
    // optional page context — if contexts specified but none provided, still allow broad match
  }

  if (
    targeting.serviceCategories?.length &&
    ctx.serviceCategory &&
    !targeting.serviceCategories.some(
      (c) => c.toLowerCase() === ctx.serviceCategory!.toLowerCase()
    )
  ) {
    return false;
  }

  if (
    targeting.states?.length &&
    ctx.state &&
    !targeting.states.map((s) => s.toUpperCase()).includes(ctx.state.toUpperCase())
  ) {
    return false;
  }

  if (
    targeting.deviceTypes?.length &&
    ctx.deviceType &&
    !targeting.deviceTypes.includes(
      ctx.deviceType as "mobile" | "tablet" | "desktop" | "unknown"
    )
  ) {
    return false;
  }

  const now = new Date();
  if (targeting.startAt && new Date(targeting.startAt) > now) return false;
  if (targeting.endAt && new Date(targeting.endAt) < now) return false;

  return true;
}

export async function serveAds(ctx: ServeContext): Promise<ServedAd[]> {
  const now = new Date();

  const campaigns = await prisma.adCampaign.findMany({
    where: {
      status: "active",
      billingInvoice: { status: "paid" },
      OR: [{ endAt: null }, { endAt: { gte: now } }],
      AND: [{ OR: [{ startAt: null }, { startAt: { lte: now } }] }],
    },
    include: {
      creatives: true,
      advertiser: { include: { organisation: true } },
      billingInvoice: true,
    },
    take: 20,
  });

  const results: ServedAd[] = [];

  for (const campaign of campaigns) {
    if (campaign.spentCents >= campaign.budgetCents) continue;

    const targeting = campaign.targeting as AdTargetingInput;
    const tgtCheck = validateTargetingObject(targeting);
    if (!tgtCheck.passed) continue;

    if (!targetingMatches(targeting, ctx)) continue;

    const creative = campaign.creatives.find((c) =>
      c.placements.includes(ctx.placement)
    );
    if (!creative) continue;

    const copyCheck = validateAdCopy(creative);
    if (!copyCheck.passed) continue;

    results.push({
      campaignId: campaign.id,
      creativeId: creative.id,
      placement: ctx.placement,
      headline: creative.headline,
      body: creative.body,
      ctaLabel: creative.ctaLabel,
      altText: creative.altText,
      landingUrl: creative.landingUrl,
      imageUrl: creative.imageFileKey
        ? adCreativePublicUrl(creative.imageFileKey)
        : null,
      targetOrganisationId: creative.targetOrganisationId,
      advertiserName: campaign.advertiser.organisation.name,
    });

    if (results.length >= 3) break;
  }

  return results;
}

export async function getActiveCampaignForTracking(campaignId: string) {
  return prisma.adCampaign.findFirst({
    where: {
      id: campaignId,
      status: "active",
      billingInvoice: { status: "paid" },
    },
  });
}
