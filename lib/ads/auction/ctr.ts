import {
  CTR_MAX,
  CTR_MIN,
  CTR_PPM_SCALE,
  CTR_PRIOR_CLICKS,
  CTR_PRIOR_IMPRESSIONS,
} from "@/lib/ads/auction/config";

export type AggregateCtrStats = {
  impressions: number;
  clicks: number;
};

/**
 * Bayesian-smoothed aggregate CTR. Never uses individual person behaviour.
 * predictedCTR = (clicks + priorClicks) / (impressions + priorImpressions)
 */
export function predictAggregateCtr(
  stats: AggregateCtrStats,
  opts?: {
    priorClicks?: number;
    priorImpressions?: number;
    min?: number;
    max?: number;
  },
): number {
  const priorClicks = opts?.priorClicks ?? CTR_PRIOR_CLICKS;
  const priorImpressions = opts?.priorImpressions ?? CTR_PRIOR_IMPRESSIONS;
  const min = opts?.min ?? CTR_MIN;
  const max = opts?.max ?? CTR_MAX;

  const impressions = Math.max(0, Math.floor(stats.impressions));
  const clicks = Math.max(0, Math.floor(stats.clicks));
  const raw =
    (clicks + priorClicks) / (impressions + priorImpressions);
  return Math.min(max, Math.max(min, raw));
}

/** Convert ratio CTR to parts-per-million fixed point. */
export function ctrToPpm(ctr: number): bigint {
  const clamped = Math.min(CTR_MAX, Math.max(CTR_MIN, ctr));
  return BigInt(Math.round(clamped * Number(CTR_PPM_SCALE)));
}

export function ppmToCtr(ppm: bigint): number {
  return Number(ppm) / Number(CTR_PPM_SCALE);
}
