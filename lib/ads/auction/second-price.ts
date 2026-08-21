import {
  AUCTION_ALGORITHM_VERSION,
  AUCTION_INCREMENT_MICROS,
} from "@/lib/ads/auction/config";
import {
  clearingEcpmToCpc,
  computeEffectiveAuctionScore,
  computeRawEcpmMicros,
  type BidModel,
} from "@/lib/ads/auction/ecpm";
import type { AdsMicros } from "@/lib/ads/money/micros";

export type AuctionCandidate = {
  campaignId: string;
  bidModel: BidModel;
  maxBidMicros: AdsMicros;
  predictedCtrPpm: bigint;
  qualityMilli: number;
  /** House campaigns do not compete monetarily. */
  isHouse: boolean;
};

export type AuctionOutcome =
  | {
      fill: "paid";
      winnerCampaignId: string;
      winnerBidModel: "CPM" | "CPC";
      winnerMaxBidMicros: AdsMicros;
      winnerRawEcpmMicros: AdsMicros;
      winnerQualityMilli: number;
      runnerUpEffectiveScore: AdsMicros | null;
      reservePriceMicros: AdsMicros;
      clearingEcpmMicros: AdsMicros;
      clearingUnitPriceMicros: AdsMicros;
      algorithmVersion: string;
    }
  | {
      fill: "house";
      winnerCampaignId: string;
      reservePriceMicros: AdsMicros;
      algorithmVersion: string;
    }
  | {
      fill: "no_eligible_internal_bid";
      reservePriceMicros: AdsMicros;
      algorithmVersion: string;
      reason:
        | "NO_PAID_MEETS_RESERVE"
        | "NO_CANDIDATES"
        | "NO_HOUSE_FALLBACK";
    };

/**
 * Quality-adjusted second-price auction for MapAble-owned inventory.
 *
 * Winner = highest effectiveAuctionScore = rawEcpm × quality
 * Clearing eCPM ≈ max(reserve, runnerUpEffective / winnerQuality + increment)
 * Cap: never above winner raw eCPM (declared max).
 */
export function runSecondPriceAuction(input: {
  candidates: AuctionCandidate[];
  reserveCpmMicros: AdsMicros;
  auctionIncrementMicros?: AdsMicros;
}): AuctionOutcome {
  const increment = input.auctionIncrementMicros ?? AUCTION_INCREMENT_MICROS;
  const reserve = input.reserveCpmMicros;
  const algorithmVersion = AUCTION_ALGORITHM_VERSION;

  const paid = input.candidates.filter((c) => !c.isHouse && c.bidModel !== "HOUSE");
  const house = input.candidates.filter((c) => c.isHouse || c.bidModel === "HOUSE");

  type Scored = AuctionCandidate & {
    rawEcpm: AdsMicros;
    effective: AdsMicros;
  };

  const scored: Scored[] = paid
    .map((c) => {
      const rawEcpm = computeRawEcpmMicros({
        bidModel: c.bidModel,
        maxBidMicros: c.maxBidMicros,
        predictedCtrPpm: c.predictedCtrPpm,
      });
      const effective = computeEffectiveAuctionScore(rawEcpm, c.qualityMilli);
      return { ...c, rawEcpm, effective };
    })
    .filter((c) => c.rawEcpm >= reserve)
    .sort((a, b) => {
      if (b.effective !== a.effective) {
        return b.effective > a.effective ? 1 : -1;
      }
      // Deterministic tie-break
      return a.campaignId.localeCompare(b.campaignId);
    });

  if (scored.length === 0) {
    const houseWinner = house.sort((a, b) =>
      a.campaignId.localeCompare(b.campaignId),
    )[0];
    if (houseWinner) {
      return {
        fill: "house",
        winnerCampaignId: houseWinner.campaignId,
        reservePriceMicros: reserve,
        algorithmVersion,
      };
    }
    return {
      fill: "no_eligible_internal_bid",
      reservePriceMicros: reserve,
      algorithmVersion,
      reason: paid.length === 0 ? "NO_CANDIDATES" : "NO_PAID_MEETS_RESERVE",
    };
  }

  const winner = scored[0]!;
  const runnerUp = scored[1] ?? null;
  const winnerQuality = BigInt(Math.max(1, Math.round(winner.qualityMilli)));

  let clearingEcpm: AdsMicros;
  if (!runnerUp) {
    clearingEcpm = reserve;
  } else {
    // runnerUpEquivalent = runnerUpEffective / winnerQuality * 1000 (milli)
    const runnerUpEquivalent =
      (runnerUp.effective * 1000n + winnerQuality / 2n) / winnerQuality;
    const withIncrement = runnerUpEquivalent + increment;
    const floored =
      withIncrement > reserve ? withIncrement : reserve;
    clearingEcpm = floored < winner.rawEcpm ? floored : winner.rawEcpm;
  }

  // Cap at winner max (raw eCPM)
  if (clearingEcpm > winner.rawEcpm) {
    clearingEcpm = winner.rawEcpm;
  }

  let clearingUnit: AdsMicros;
  if (winner.bidModel === "CPC") {
    clearingUnit = clearingEcpmToCpc(clearingEcpm, winner.predictedCtrPpm);
    if (clearingUnit > winner.maxBidMicros) {
      clearingUnit = winner.maxBidMicros;
    }
  } else {
    clearingUnit = clearingEcpm;
  }

  return {
    fill: "paid",
    winnerCampaignId: winner.campaignId,
    winnerBidModel: winner.bidModel as "CPM" | "CPC",
    winnerMaxBidMicros: winner.maxBidMicros,
    winnerRawEcpmMicros: winner.rawEcpm,
    winnerQualityMilli: winner.qualityMilli,
    runnerUpEffectiveScore: runnerUp?.effective ?? null,
    reservePriceMicros: reserve,
    clearingEcpmMicros: clearingEcpm,
    clearingUnitPriceMicros: clearingUnit,
    algorithmVersion,
  };
}
