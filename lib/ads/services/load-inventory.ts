import { getSyntheticInternalInventory } from "@/lib/ads/fixtures/synthetic-inventory";
import type { InternalInventory } from "@/lib/ads/providers/internal/mapable-internal-adapter";
import type { RankableCampaign } from "@/lib/ads/ranking/rank-campaigns";
import type { AdCreativePayload } from "@/lib/ads/types";
import { prisma } from "@/lib/prisma";

/**
 * Load internal inventory from DB; fall back to synthetic fixtures when empty
 * or when DB is unavailable (tests / early foundation).
 */
export async function loadInternalInventory(): Promise<InternalInventory> {
  try {
    const campaigns = await prisma.adCampaign.findMany({
      where: {
        status: { in: ["ACTIVE", "APPROVED"] },
        advertiser: { status: "ACTIVE" },
      },
      include: {
        advertiser: true,
        creatives: {
          where: { status: { in: ["APPROVED", "ACTIVE"] } },
          take: 1,
        },
        targets: { take: 1 },
      },
    });

    if (campaigns.length === 0) {
      return getSyntheticInternalInventory();
    }

    const rankable: RankableCampaign[] = [];
    const creativesByCampaignId: Record<string, AdCreativePayload> = {};

    for (const c of campaigns) {
      const creative = c.creatives[0];
      if (!creative) continue;
      const target = c.targets[0];
      rankable.push({
        id: c.id,
        status: c.status,
        priority: c.priority,
        isHouse: c.isHouse,
        placementCodes: c.placementCodes,
        region: target?.region,
        category: target?.category,
        geometry: target?.geometry ?? { type: "NATIONAL" },
        startAt: c.startAt,
        endAt: c.endAt,
        advertiserStatus: c.advertiser.status,
        creativeApproved: true,
      });
      creativesByCampaignId[c.id] = {
        id: creative.id,
        campaignId: c.id,
        format: creative.format,
        headline: creative.headline,
        body: creative.body,
        imageUrl: creative.imageUrl,
        altText: creative.altText,
        destinationUrl: creative.destinationUrl,
        businessName: creative.businessName,
        latitude: creative.latitude,
        longitude: creative.longitude,
      };
    }

    if (rankable.length === 0) {
      return getSyntheticInternalInventory();
    }

    return { campaigns: rankable, creativesByCampaignId };
  } catch {
    return getSyntheticInternalInventory();
  }
}
