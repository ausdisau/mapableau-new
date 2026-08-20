import type { AdsFlagEnv } from "@/lib/ads/config/flags";
import { adsFlagsConfig } from "@/lib/ads/config/flags";
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

export type InternalInventory = {
  campaigns: RankableCampaign[];
  creativesByCampaignId: Record<string, AdCreativePayload>;
};

/**
 * Fully functioning internal provider for house promotions and direct-sold campaigns.
 * Inventory is injected (DB-backed in production paths; fixtures in tests).
 */
export class MapAbleInternalAdsAdapter implements AdProviderAdapter {
  readonly providerId = "mapable_internal" as const;

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
}
