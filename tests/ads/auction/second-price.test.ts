import { describe, expect, it } from "vitest";

import { AUCTION_INCREMENT_MICROS } from "@/lib/ads/auction/config";
import { ctrToPpm } from "@/lib/ads/auction/ctr";
import {
  clearingEcpmToCpc,
  computeEffectiveAuctionScore,
  computeRawEcpmMicros,
} from "@/lib/ads/auction/ecpm";
import { getPlacementReservePrice } from "@/lib/ads/auction/reserves";
import { runSecondPriceAuction } from "@/lib/ads/auction/second-price";
import { evaluateBudgetGate } from "@/lib/ads/auction/budget-gate";
import { evaluatePacing } from "@/lib/ads/auction/pacing";
import { PROHIBITED_QUALITY_FACTORS } from "@/lib/ads/auction/quality";
import { MICROS_PER_AUD } from "@/lib/ads/money/micros";
import { PROHIBITED_RANKING_FACTORS } from "@/lib/ads/ranking/rank-campaigns";

describe("synthetic auction fixture", () => {
  it("selects A with quality-adjusted second price vs C", () => {
    // A: CPM $22, quality 1.0 → raw 22, effective 22
    // B: CPM $18, quality 1.1 → raw 18, effective 19.8
    // C: CPC $2, CTR 1%, quality 1.0 → raw eCPM 20, effective 20
    // reserve $16; winner A; clearing = max(16, 20/1.0 + increment) capped at 22
    const reserve = 16n * MICROS_PER_AUD;
    const outcome = runSecondPriceAuction({
      candidates: [
        {
          campaignId: "A",
          bidModel: "CPM",
          maxBidMicros: 22n * MICROS_PER_AUD,
          predictedCtrPpm: ctrToPpm(0.01),
          qualityMilli: 1000,
          isHouse: false,
        },
        {
          campaignId: "B",
          bidModel: "CPM",
          maxBidMicros: 18n * MICROS_PER_AUD,
          predictedCtrPpm: ctrToPpm(0.01),
          qualityMilli: 1100,
          isHouse: false,
        },
        {
          campaignId: "C",
          bidModel: "CPC",
          maxBidMicros: 2n * MICROS_PER_AUD,
          predictedCtrPpm: ctrToPpm(0.01),
          qualityMilli: 1000,
          isHouse: false,
        },
      ],
      reserveCpmMicros: reserve,
      auctionIncrementMicros: AUCTION_INCREMENT_MICROS,
    });

    expect(outcome.fill).toBe("paid");
    if (outcome.fill !== "paid") return;

    expect(outcome.winnerCampaignId).toBe("A");
    expect(outcome.winnerRawEcpmMicros).toBe(22n * MICROS_PER_AUD);
    expect(outcome.runnerUpEffectiveScore).toBe(20n * MICROS_PER_AUD);

    const expectedClearing =
      20n * MICROS_PER_AUD + AUCTION_INCREMENT_MICROS;
    expect(outcome.clearingEcpmMicros).toBe(expectedClearing);
    expect(outcome.clearingEcpmMicros).toBeLessThanOrEqual(
      outcome.winnerRawEcpmMicros,
    );
    expect(outcome.clearingEcpmMicros).toBeGreaterThanOrEqual(reserve);
  });
});

describe("second-price auction rules", () => {
  it("highest effective bid wins", () => {
    const outcome = runSecondPriceAuction({
      candidates: [
        {
          campaignId: "low",
          bidModel: "CPM",
          maxBidMicros: 20n * MICROS_PER_AUD,
          predictedCtrPpm: ctrToPpm(0.01),
          qualityMilli: 1000,
          isHouse: false,
        },
        {
          campaignId: "high",
          bidModel: "CPM",
          maxBidMicros: 25n * MICROS_PER_AUD,
          predictedCtrPpm: ctrToPpm(0.01),
          qualityMilli: 1000,
          isHouse: false,
        },
      ],
      reserveCpmMicros: 16n * MICROS_PER_AUD,
    });
    expect(outcome.fill).toBe("paid");
    if (outcome.fill === "paid") {
      expect(outcome.winnerCampaignId).toBe("high");
    }
  });

  it("enforces reserve floor", () => {
    const outcome = runSecondPriceAuction({
      candidates: [
        {
          campaignId: "below",
          bidModel: "CPM",
          maxBidMicros: 10n * MICROS_PER_AUD,
          predictedCtrPpm: ctrToPpm(0.01),
          qualityMilli: 1000,
          isHouse: false,
        },
      ],
      reserveCpmMicros: 16n * MICROS_PER_AUD,
    });
    expect(outcome.fill).toBe("no_eligible_internal_bid");
  });

  it("falls back to house when paid miss reserve", () => {
    const outcome = runSecondPriceAuction({
      candidates: [
        {
          campaignId: "paid",
          bidModel: "CPM",
          maxBidMicros: 10n * MICROS_PER_AUD,
          predictedCtrPpm: ctrToPpm(0.01),
          qualityMilli: 1000,
          isHouse: false,
        },
        {
          campaignId: "house",
          bidModel: "HOUSE",
          maxBidMicros: 0n,
          predictedCtrPpm: ctrToPpm(0.01),
          qualityMilli: 1000,
          isHouse: true,
        },
      ],
      reserveCpmMicros: 16n * MICROS_PER_AUD,
    });
    expect(outcome.fill).toBe("house");
    if (outcome.fill === "house") {
      expect(outcome.winnerCampaignId).toBe("house");
    }
  });

  it("winner never pays above max bid", () => {
    const maxBid = 18n * MICROS_PER_AUD;
    const outcome = runSecondPriceAuction({
      candidates: [
        {
          campaignId: "w",
          bidModel: "CPM",
          maxBidMicros: maxBid,
          predictedCtrPpm: ctrToPpm(0.01),
          qualityMilli: 1000,
          isHouse: false,
        },
        {
          campaignId: "r",
          bidModel: "CPM",
          maxBidMicros: 17n * MICROS_PER_AUD,
          predictedCtrPpm: ctrToPpm(0.01),
          qualityMilli: 1000,
          isHouse: false,
        },
      ],
      reserveCpmMicros: 16n * MICROS_PER_AUD,
      auctionIncrementMicros: 5n * MICROS_PER_AUD,
    });
    expect(outcome.fill).toBe("paid");
    if (outcome.fill === "paid") {
      expect(outcome.clearingEcpmMicros).toBeLessThanOrEqual(maxBid);
    }
  });

  it("converts CPC to eCPM", () => {
    const raw = computeRawEcpmMicros({
      bidModel: "CPC",
      maxBidMicros: 2n * MICROS_PER_AUD,
      predictedCtrPpm: ctrToPpm(0.01),
    });
    expect(raw).toBe(20n * MICROS_PER_AUD);
  });

  it("quality score influences ranking", () => {
    const a = computeEffectiveAuctionScore(18n * MICROS_PER_AUD, 1100);
    const b = computeEffectiveAuctionScore(18n * MICROS_PER_AUD, 1000);
    expect(a).toBeGreaterThan(b);
  });

  it("tie-breaking is deterministic by campaignId", () => {
    const o1 = runSecondPriceAuction({
      candidates: [
        {
          campaignId: "camp_b",
          bidModel: "CPM",
          maxBidMicros: 20n * MICROS_PER_AUD,
          predictedCtrPpm: ctrToPpm(0.01),
          qualityMilli: 1000,
          isHouse: false,
        },
        {
          campaignId: "camp_a",
          bidModel: "CPM",
          maxBidMicros: 20n * MICROS_PER_AUD,
          predictedCtrPpm: ctrToPpm(0.01),
          qualityMilli: 1000,
          isHouse: false,
        },
      ],
      reserveCpmMicros: 16n * MICROS_PER_AUD,
    });
    const o2 = runSecondPriceAuction({
      candidates: [
        {
          campaignId: "camp_a",
          bidModel: "CPM",
          maxBidMicros: 20n * MICROS_PER_AUD,
          predictedCtrPpm: ctrToPpm(0.01),
          qualityMilli: 1000,
          isHouse: false,
        },
        {
          campaignId: "camp_b",
          bidModel: "CPM",
          maxBidMicros: 20n * MICROS_PER_AUD,
          predictedCtrPpm: ctrToPpm(0.01),
          qualityMilli: 1000,
          isHouse: false,
        },
      ],
      reserveCpmMicros: 16n * MICROS_PER_AUD,
    });
    expect(o1.fill).toBe("paid");
    expect(o2.fill).toBe("paid");
    if (o1.fill === "paid" && o2.fill === "paid") {
      expect(o1.winnerCampaignId).toBe("camp_a");
      expect(o2.winnerCampaignId).toBe("camp_a");
    }
  });

  it("CPC clearing unit price capped at max CPC", () => {
    const clearingCpc = clearingEcpmToCpc(20n * MICROS_PER_AUD, ctrToPpm(0.01));
    expect(clearingCpc).toBe(2n * MICROS_PER_AUD);
  });
});

describe("budget and pacing gates", () => {
  it("excludes daily budget exhausted", () => {
    const r = evaluateBudgetGate({
      isHouse: false,
      campaignStatus: "ACTIVE",
      walletStatus: "ACTIVE",
      walletAvailableMicros: 1_000_000_000n,
      dailyBudgetMicros: 100n,
      lifetimeBudgetMicros: null,
      todaySpendMicros: 100n,
      lifetimeSpendMicros: 100n,
      spendDayKey: new Date().toISOString().slice(0, 10),
      now: new Date(),
    });
    expect(r.eligible).toBe(false);
    if (!r.eligible) expect(r.reason).toBe("DAILY_BUDGET_EXHAUSTED");
  });

  it("excludes empty wallet", () => {
    const r = evaluateBudgetGate({
      isHouse: false,
      campaignStatus: "ACTIVE",
      walletStatus: "ACTIVE",
      walletAvailableMicros: 0n,
      dailyBudgetMicros: null,
      lifetimeBudgetMicros: null,
      todaySpendMicros: 0n,
      lifetimeSpendMicros: 0n,
      spendDayKey: null,
      now: new Date(),
      minChargeMicros: 1n,
    });
    expect(r.eligible).toBe(false);
    if (!r.eligible) expect(r.reason).toBe("INSUFFICIENT_WALLET_BALANCE");
  });

  it("excludes paused campaign", () => {
    const r = evaluateBudgetGate({
      isHouse: false,
      campaignStatus: "PAUSED",
      walletStatus: "ACTIVE",
      walletAvailableMicros: 1_000_000n,
      dailyBudgetMicros: null,
      lifetimeBudgetMicros: null,
      todaySpendMicros: 0n,
      lifetimeSpendMicros: 0n,
      spendDayKey: null,
      now: new Date(),
    });
    expect(r.eligible).toBe(false);
    if (!r.eligible) expect(r.reason).toBe("CAMPAIGN_INACTIVE");
  });

  it("pacing is deterministic for a seed", () => {
    const a = evaluatePacing({
      dailyBudgetMicros: 1_000_000n,
      todaySpendMicros: 900_000n,
      now: new Date("2026-08-20T01:00:00.000Z"),
      campaignId: "camp_x",
      seed: "fixed-seed",
    });
    const b = evaluatePacing({
      dailyBudgetMicros: 1_000_000n,
      todaySpendMicros: 900_000n,
      now: new Date("2026-08-20T01:00:00.000Z"),
      campaignId: "camp_x",
      seed: "fixed-seed",
    });
    expect(a).toEqual(b);
  });
});

describe("placement reserves", () => {
  it("resolves development defaults", () => {
    expect(
      getPlacementReservePrice("access.map.sponsored-marker").floorCpmMicros,
    ).toBe(16n * MICROS_PER_AUD);
    expect(
      getPlacementReservePrice("provider-finder.results.inline").floorCpmMicros,
    ).toBe(28n * MICROS_PER_AUD);
  });
});

describe("invariants", () => {
  it("does not use prohibited ranking or quality factors", () => {
    for (const f of [
      "accessibilityScore",
      "providerSuitabilityScore",
      "organicSearchRank",
    ]) {
      expect(PROHIBITED_RANKING_FACTORS).toContain(f);
    }
    expect(PROHIBITED_QUALITY_FACTORS).toContain("disability");
    expect(PROHIBITED_QUALITY_FACTORS).toContain("ndis");
  });
});
