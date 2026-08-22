import { CTR_PPM_SCALE } from "@/lib/ads/auction/config";
import { mulDivRound, type AdsMicros } from "@/lib/ads/money/micros";

export type BidModel = "CPM" | "CPC" | "HOUSE";

/**
 * Normalise paid bids to raw eCPM micros.
 * CPM: rawEcpm = maxCpm
 * CPC: rawEcpm = maxCpc × predictedCTR × 1000
 */
export function computeRawEcpmMicros(input: {
  bidModel: BidModel;
  maxBidMicros: AdsMicros;
  predictedCtrPpm: bigint;
}): AdsMicros {
  if (input.bidModel === "HOUSE") {
    return 0n;
  }
  if (input.bidModel === "CPM") {
    return input.maxBidMicros;
  }
  // CPC: maxCpc * ctr * 1000 = maxCpc * ppm / 1e6 * 1000
  return mulDivRound(
    input.maxBidMicros,
    input.predictedCtrPpm * 1000n,
    CTR_PPM_SCALE,
  );
}

/** effectiveAuctionScore = rawEcpm × (qualityMilli / 1000) */
export function computeEffectiveAuctionScore(
  rawEcpmMicros: AdsMicros,
  qualityMilli: number,
): AdsMicros {
  const q = BigInt(Math.round(qualityMilli));
  return mulDivRound(rawEcpmMicros, q, 1000n);
}

/**
 * Convert clearing eCPM back to CPC unit price.
 * clearingCpc = clearingEcpm / (predictedCTR × 1000)
 */
export function clearingEcpmToCpc(
  clearingEcpmMicros: AdsMicros,
  predictedCtrPpm: bigint,
): AdsMicros {
  if (predictedCtrPpm <= 0n) {
    throw new Error("predicted CTR must be positive");
  }
  // cpc = ecpm / (ctr * 1000) = ecpm * 1e6 / (ppm * 1000)
  return mulDivRound(clearingEcpmMicros, CTR_PPM_SCALE, predictedCtrPpm * 1000n);
}
