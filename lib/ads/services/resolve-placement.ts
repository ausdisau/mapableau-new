import { adsFlagsConfig } from "@/lib/ads/config/flags";
import {
  buildPlacementRequest,
  routePlacementRequest,
} from "@/lib/ads/mediation/provider-router";
import { emitAdsEvent } from "@/lib/ads/observability/events";
import { EthicalAdsAdapter } from "@/lib/ads/providers/ethicalads/ethicalads-adapter";
import { GoogleAdManagerAdapter } from "@/lib/ads/providers/google-ad-manager/google-ad-manager-adapter";
import { MapAbleInternalAdsAdapter } from "@/lib/ads/providers/internal/mapable-internal-adapter";
import { loadInternalInventory } from "@/lib/ads/services/load-inventory";
import type { AdPlacementFill, PlacementCode } from "@/lib/ads/types";
import { isPlacementCode } from "@/lib/ads/placement-registry";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export type ResolvePlacementInput = {
  placement: string;
  surface: "access" | "provider_finder";
  bbox?: [number, number, number, number];
  zoom?: number;
  category?: string;
  regionCode?: string;
  consentForPersonalisedAds?: boolean;
  anonymousSessionRef?: string;
};

export async function resolveAdPlacement(
  input: ResolvePlacementInput,
): Promise<AdPlacementFill> {
  if (!isPlacementCode(input.placement)) {
    return { kind: "no_fill", reasonCode: "PLACEMENT_UNSUPPORTED" };
  }

  const requestId = randomUUID();
  const inventory = await loadInternalInventory();
  const internalAdapter = new MapAbleInternalAdsAdapter(inventory);
  const adapters = {
    mapable_internal: internalAdapter,
    google_ad_manager: new GoogleAdManagerAdapter(),
    ethicalads: new EthicalAdsAdapter(),
  };

  const request = buildPlacementRequest({
    placement: input.placement as PlacementCode,
    requestId,
    surface: input.surface,
    bbox: input.bbox,
    zoom: input.zoom,
    category: input.category,
    regionCode: input.regionCode,
    consentForPersonalisedAds: input.consentForPersonalisedAds,
    anonymousSessionRef: input.anonymousSessionRef,
  });

  const fill = await routePlacementRequest(request, { adapters });

  // Persist decision when measurement enabled (best-effort)
  if (adsFlagsConfig.isMeasurementEnabled()) {
    try {
      const decisionId =
        fill.kind === "no_fill" ? `dec_${requestId}` : fill.decisionId;
      await prisma.adDecision.create({
        data: {
          id: decisionId,
          requestId,
          placementCode: input.placement,
          provider:
            fill.kind === "internal"
              ? "mapable_internal"
              : fill.kind === "external_dom"
                ? fill.provider
                : undefined,
          campaignId: fill.kind === "internal" ? fill.campaignId : undefined,
          decision:
            fill.kind === "internal"
              ? "FILL_INTERNAL"
              : fill.kind === "external_dom"
                ? "FILL_EXTERNAL"
                : "NO_FILL",
          reasonCode: fill.kind === "no_fill" ? fill.reasonCode : undefined,
        },
      });

      const auctionMeta = internalAdapter.lastAuctionMeta?.outcome;
      if (
        auctionMeta &&
        adsFlagsConfig.isAuctionEnabled() &&
        fill.kind === "internal"
      ) {
        await prisma.adAuctionResult.create({
          data: {
            decisionId,
            placementCode: input.placement,
            winnerCampaignId:
              auctionMeta.fill === "no_eligible_internal_bid"
                ? undefined
                : auctionMeta.winnerCampaignId,
            winnerBidModel:
              auctionMeta.fill === "paid"
                ? auctionMeta.winnerBidModel
                : auctionMeta.fill === "house"
                  ? "HOUSE"
                  : undefined,
            winnerMaxBidMicros:
              auctionMeta.fill === "paid"
                ? auctionMeta.winnerMaxBidMicros
                : undefined,
            winnerRawEcpmMicros:
              auctionMeta.fill === "paid"
                ? auctionMeta.winnerRawEcpmMicros
                : undefined,
            winnerQualityScoreMilli:
              auctionMeta.fill === "paid"
                ? auctionMeta.winnerQualityMilli
                : undefined,
            runnerUpEffectiveScore:
              auctionMeta.fill === "paid"
                ? auctionMeta.runnerUpEffectiveScore
                : undefined,
            reservePriceMicros: auctionMeta.reservePriceMicros,
            clearingEcpmMicros:
              auctionMeta.fill === "paid"
                ? auctionMeta.clearingEcpmMicros
                : undefined,
            clearingUnitPriceMicros:
              auctionMeta.fill === "paid"
                ? auctionMeta.clearingUnitPriceMicros
                : undefined,
            algorithmVersion: auctionMeta.algorithmVersion,
          },
        });
      }
    } catch {
      emitAdsEvent({
        event: "ads.provider_error",
        reasonCode: "decision_persist_failed",
        placementCode: input.placement,
      });
    }
  }

  return fill;
}
