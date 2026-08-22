import {
  campaignGeometryIntersectsViewport,
  parseCampaignGeometry,
  type BBox,
} from "@/lib/ads/geo/campaign-geo";
import type {
  AdEligibilityResult,
  AdRankingReasonCode,
  InternalAdContext,
  PlacementCode,
} from "@/lib/ads/types";

export type RankableCampaign = {
  id: string;
  status: string;
  priority: number;
  isHouse: boolean;
  placementCodes: string[];
  region?: string | null;
  category?: string | null;
  geometry?: unknown;
  startAt?: Date | null;
  endAt?: Date | null;
  advertiserStatus: string;
  creativeApproved: boolean;
  /** Optional commercial fields (auction path). */
  advertiserId?: string;
  bidModel?: "CPM" | "CPC" | "HOUSE";
  maxBidMicros?: bigint | null;
  dailyBudgetMicros?: bigint | null;
  lifetimeBudgetMicros?: bigint | null;
  todaySpendMicros?: bigint;
  lifetimeSpendMicros?: bigint;
  spendDayKey?: string | null;
  lifetimeImpressions?: number;
  lifetimeClicks?: number;
  walletStatus?: "ACTIVE" | "FROZEN" | "CLOSED" | null;
  walletAvailableMicros?: bigint;
};

/**
 * Deterministic ranking. Explicitly ignores disability, health, NDIS,
 * accessibility scores, suitability scores, and organic search rank.
 */
export function rankCampaigns(input: {
  campaigns: RankableCampaign[];
  placement: PlacementCode;
  context: InternalAdContext;
  now?: Date;
}): AdEligibilityResult[] {
  const now = input.now ?? new Date();
  const results: AdEligibilityResult[] = [];

  for (const campaign of input.campaigns) {
    const reasonCodes: AdRankingReasonCode[] = [];
    let eligible = true;

    if (campaign.status !== "ACTIVE" && campaign.status !== "APPROVED") {
      eligible = false;
    } else {
      reasonCodes.push("CAMPAIGN_ACTIVE");
    }

    if (campaign.advertiserStatus !== "ACTIVE") {
      eligible = false;
    }

    if (!campaign.creativeApproved) {
      eligible = false;
    }

    if (campaign.startAt && campaign.startAt > now) eligible = false;
    if (campaign.endAt && campaign.endAt < now) eligible = false;
    if (eligible) reasonCodes.push("SCHEDULE_MATCH");

    if (!campaign.placementCodes.includes(input.placement)) {
      eligible = false;
    } else {
      reasonCodes.push("PLACEMENT_MATCH");
    }

    if (campaign.region && input.context.regionCode) {
      if (
        campaign.region.toLowerCase() ===
        input.context.regionCode.toLowerCase()
      ) {
        reasonCodes.push("REGION_MATCH");
      } else if (campaign.region.toLowerCase() !== "national") {
        eligible = false;
      }
    } else if (campaign.region && campaign.region.toLowerCase() === "national") {
      reasonCodes.push("REGION_MATCH");
    }

    if (campaign.category && input.context.category) {
      if (
        campaign.category.toLowerCase() ===
        input.context.category.toLowerCase()
      ) {
        reasonCodes.push("CATEGORY_MATCH");
      }
      // Category mismatch does not hard-fail — soft relevance only
    }

    const geometry = parseCampaignGeometry(campaign.geometry);
    if (geometry) {
      const geoOk = campaignGeometryIntersectsViewport(
        geometry,
        input.context.viewportBBox as BBox | undefined,
        input.context.mapCenter,
      );
      if (geoOk) {
        reasonCodes.push("GEO_MATCH");
      } else if (geometry.type !== "NATIONAL") {
        eligible = false;
      }
    }

    if (campaign.isHouse) {
      reasonCodes.push("HOUSE_PROMOTION");
    }

    if (eligible) {
      reasonCodes.push("PRIORITY");
    }

    results.push({
      campaignId: campaign.id,
      eligible,
      reasonCodes,
      priority: campaign.priority,
    });
  }

  return results
    .filter((r) => r.eligible)
    .sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.campaignId.localeCompare(b.campaignId);
    });
}

/** Prohibited ranking factor names — used by invariant tests. */
export const PROHIBITED_RANKING_FACTORS = [
  "disability",
  "healthCondition",
  "funding",
  "ndis",
  "clinicalNeed",
  "vulnerability",
  "accessibilityScore",
  "providerSafetyScore",
  "providerSuitabilityScore",
  "organicSearchRank",
  "reviewManipulation",
] as const;
