import type { AdsFlagEnv } from "@/lib/ads/config/flags";
import { adsFlagsConfig } from "@/lib/ads/config/flags";
import {
  runInternalAuction,
  type AuctionableCampaign,
} from "@/lib/ads/auction/run-auction";
import type { AdProviderAdapter } from "@/lib/ads/providers/adapter";
import {
  rankCampaigns,
  type RankableCampaign,
} from "@/lib/ads/ranking/rank-campaigns";
import type {
  AdCreativePayload,
  AdPlacementRequest,
  AdProviderCapabilities,
  AdProviderDecision,
  AdRequestContext,
} from "@/lib/ads/types";
import type { AuctionOutcome } from "@/lib/ads/auction/second-price";

export type InternalInventory = {
  campaigns: RankableCampaign[];
  creativesByCampaignId: Record<string, AdCreativePayload>;
  /** Optional floor overrides keyed by placement code (from AdPlacementRule). */
  placementFloorRules?: Record<string, string>;
};

export type InternalAuctionMeta = {
  outcome: AuctionOutcome;
};

/**
 * Fully functioning internal provider for house promotions and direct-sold campaigns.
 * When auction flag is on: budget → pacing → quality-adjusted second-price.
 * When off: legacy priority ranking (foundation behaviour).
 */
export class MapAbleInternalAdsAdapter implements AdProviderAdapter {
  readonly providerId = "mapable_internal" as const;
  lastAuctionMeta: InternalAuctionMeta | null = null;

  constructor(
    private readonly inventory: InternalInventory,
    private readonly env: AdsFlagEnv = process.env,
  ) {}

  getCapabilities(): AdProviderCapabilities {
    return {
      mapMarkers: true,
      domSlots: true,
      contextualTargeting: true,
      coarseGeoTargeting: true,
      personalisedTargeting: false,
      requiresConsent: false,
      requiresExclusivePageMode: false,
    };
  }

  async isAvailable(_context: AdRequestContext): Promise<boolean> {
    return adsFlagsConfig.isInternalEnabled(this.env);
  }

  async requestPlacement(
    request: AdPlacementRequest,
  ): Promise<AdProviderDecision> {
    if (!(await this.isAvailable(request.context))) {
      return { fill: false, reasonCode: "PROVIDER_DISABLED" };
    }

    if (adsFlagsConfig.isAuctionEnabled(this.env)) {
      return this.requestPlacementViaAuction(request);
    }

    const ranked = rankCampaigns({
      campaigns: this.inventory.campaigns,
      placement: request.placement,
      context: request.context.internal,
      now: request.context.now,
    });

    const winner = ranked[0];
    if (!winner) {
      return { fill: false, reasonCode: "NO_ELIGIBLE_CAMPAIGN" };
    }

    const creative = this.inventory.creativesByCampaignId[winner.campaignId];
    if (!creative) {
      return { fill: false, reasonCode: "CREATIVE_UNAPPROVED" };
    }

    return {
      fill: true,
      kind: "internal",
      campaignId: winner.campaignId,
      creative,
      reasonCodes: winner.reasonCodes,
    };
  }

  private requestPlacementViaAuction(
    request: AdPlacementRequest,
  ): AdProviderDecision {
    const auctionable: AuctionableCampaign[] = this.inventory.campaigns.map(
      (c) => ({
        ...c,
        advertiserId: c.advertiserId ?? "unknown",
        bidModel: c.isHouse
          ? "HOUSE"
          : ((c.bidModel ?? "CPM") as "CPM" | "CPC" | "HOUSE"),
        maxBidMicros: c.maxBidMicros ?? null,
        dailyBudgetMicros: c.dailyBudgetMicros ?? null,
        lifetimeBudgetMicros: c.lifetimeBudgetMicros ?? null,
        todaySpendMicros: c.todaySpendMicros ?? 0n,
        lifetimeSpendMicros: c.lifetimeSpendMicros ?? 0n,
        spendDayKey: c.spendDayKey ?? null,
        lifetimeImpressions: c.lifetimeImpressions ?? 0,
        lifetimeClicks: c.lifetimeClicks ?? 0,
        walletStatus: c.walletStatus ?? (c.isHouse ? null : "ACTIVE"),
        walletAvailableMicros: c.walletAvailableMicros ?? (c.isHouse ? 0n : 0n),
      }),
    );

    // House campaigns without wallets are still eligible via HOUSE_NO_CHARGE
    for (const c of auctionable) {
      if (c.isHouse || c.bidModel === "HOUSE") {
        c.walletStatus = c.walletStatus ?? "ACTIVE";
        c.walletAvailableMicros = c.walletAvailableMicros ?? 0n;
      }
    }

    const { outcome } = runInternalAuction({
      campaigns: auctionable,
      placement: request.placement,
      context: request.context.internal,
      now: request.context.now,
      ruleFloorCpmMicros:
        this.inventory.placementFloorRules?.[request.placement] ?? null,
    });

    this.lastAuctionMeta = { outcome };

    if (outcome.fill === "no_eligible_internal_bid") {
      return { fill: false, reasonCode: "NO_ELIGIBLE_CAMPAIGN" };
    }

    const campaignId = outcome.winnerCampaignId;
    const creative = this.inventory.creativesByCampaignId[campaignId];
    if (!creative) {
      return { fill: false, reasonCode: "CREATIVE_UNAPPROVED" };
    }

    return {
      fill: true,
      kind: "internal",
      campaignId,
      creative,
      reasonCodes:
        outcome.fill === "house"
          ? ["HOUSE_PROMOTION", "CAMPAIGN_ACTIVE", "PLACEMENT_MATCH"]
          : ["CAMPAIGN_ACTIVE", "PLACEMENT_MATCH", "PRIORITY"],
    };
  }
}
