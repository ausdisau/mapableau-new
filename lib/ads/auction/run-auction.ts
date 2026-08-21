import { evaluateBudgetGate } from "@/lib/ads/auction/budget-gate";
import { ctrToPpm, predictAggregateCtr } from "@/lib/ads/auction/ctr";
import { evaluatePacing } from "@/lib/ads/auction/pacing";
import { computeQualityScoreMilli } from "@/lib/ads/auction/quality";
import { getPlacementReservePrice } from "@/lib/ads/auction/reserves";
import {
  runSecondPriceAuction,
  type AuctionCandidate,
  type AuctionOutcome,
} from "@/lib/ads/auction/second-price";
import { cpmChargePerImpression, type AdsMicros } from "@/lib/ads/money/micros";
import type { RankableCampaign } from "@/lib/ads/ranking/rank-campaigns";
import { rankCampaigns } from "@/lib/ads/ranking/rank-campaigns";
import type { InternalAdContext, PlacementCode } from "@/lib/ads/types";

export type AuctionableCampaign = RankableCampaign & {
  advertiserId: string;
  bidModel: "CPM" | "CPC" | "HOUSE";
  maxBidMicros: AdsMicros | null;
  dailyBudgetMicros: AdsMicros | null;
  lifetimeBudgetMicros: AdsMicros | null;
  todaySpendMicros: AdsMicros;
  lifetimeSpendMicros: AdsMicros;
  spendDayKey: string | null;
  lifetimeImpressions: number;
  lifetimeClicks: number;
  walletStatus: "ACTIVE" | "FROZEN" | "CLOSED" | null;
  walletAvailableMicros: AdsMicros;
};

export type InternalAuctionResult = {
  outcome: AuctionOutcome;
  eligibilityExcluded: Array<{ campaignId: string; reason: string }>;
};

/**
 * Full internal path after policy:
 * eligibility → budget → pacing → quality → eCPM → second-price auction.
 */
export function runInternalAuction(input: {
  campaigns: AuctionableCampaign[];
  placement: PlacementCode;
  context: InternalAdContext;
  now?: Date;
  ruleFloorCpmMicros?: string | null;
  auctionIncrementMicros?: AdsMicros;
}): InternalAuctionResult {
  const now = input.now ?? new Date();
  const reserve = getPlacementReservePrice(input.placement, {
    ruleFloorCpmMicros: input.ruleFloorCpmMicros,
  }).floorCpmMicros;
  const minImpressionCharge = cpmChargePerImpression(reserve);

  const ranked = rankCampaigns({
    campaigns: input.campaigns,
    placement: input.placement,
    context: input.context,
    now,
  });
  const rankedById = new Map(ranked.map((r) => [r.campaignId, r]));
  const campaignById = new Map(input.campaigns.map((c) => [c.id, c]));

  const excluded: Array<{ campaignId: string; reason: string }> = [];
  const candidates: AuctionCandidate[] = [];

  for (const c of input.campaigns) {
    const eligibility = rankedById.get(c.id);
    if (!eligibility) {
      excluded.push({ campaignId: c.id, reason: "POLICY_OR_ELIGIBILITY" });
      continue;
    }

    const isHouse = c.isHouse || c.bidModel === "HOUSE";
    const budget = evaluateBudgetGate({
      isHouse,
      campaignStatus: c.status,
      walletStatus: c.walletStatus,
      walletAvailableMicros: c.walletAvailableMicros,
      dailyBudgetMicros: c.dailyBudgetMicros,
      lifetimeBudgetMicros: c.lifetimeBudgetMicros,
      todaySpendMicros: c.todaySpendMicros,
      lifetimeSpendMicros: c.lifetimeSpendMicros,
      spendDayKey: c.spendDayKey,
      now,
      minChargeMicros: isHouse ? 0n : minImpressionCharge,
    });
    if (!budget.eligible) {
      excluded.push({ campaignId: c.id, reason: budget.reason });
      continue;
    }

    if (!isHouse) {
      const pacing = evaluatePacing({
        dailyBudgetMicros: c.dailyBudgetMicros,
        todaySpendMicros: c.todaySpendMicros,
        now,
        campaignId: c.id,
      });
      if (!pacing.enter) {
        excluded.push({ campaignId: c.id, reason: pacing.reason });
        continue;
      }
    }

    const qualityMilli = computeQualityScoreMilli({
      reasonCodes: eligibility.reasonCodes,
      context: input.context,
      campaignCategory: c.category,
      campaignRegion: c.region,
      creativeApproved: c.creativeApproved,
    });

    const predictedCtr = predictAggregateCtr({
      impressions: c.lifetimeImpressions,
      clicks: c.lifetimeClicks,
    });

    if (isHouse) {
      candidates.push({
        campaignId: c.id,
        bidModel: "HOUSE",
        maxBidMicros: 0n,
        predictedCtrPpm: ctrToPpm(predictedCtr),
        qualityMilli,
        isHouse: true,
      });
      continue;
    }

    if (c.maxBidMicros == null || c.maxBidMicros <= 0n) {
      excluded.push({ campaignId: c.id, reason: "MISSING_BID" });
      continue;
    }

    candidates.push({
      campaignId: c.id,
      bidModel: c.bidModel === "CPC" ? "CPC" : "CPM",
      maxBidMicros: c.maxBidMicros,
      predictedCtrPpm: ctrToPpm(predictedCtr),
      qualityMilli,
      isHouse: false,
    });
  }

  // Prefer eligible ranked order stability is handled inside auction by score + id
  void campaignById;

  const outcome = runSecondPriceAuction({
    candidates,
    reserveCpmMicros: reserve,
    auctionIncrementMicros: input.auctionIncrementMicros,
  });

  return { outcome, eligibilityExcluded: excluded };
}
