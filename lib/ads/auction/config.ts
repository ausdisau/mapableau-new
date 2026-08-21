/**
 * Auction / pricing configuration for MapAble Ads.
 * Reserve floors are defaults; operator overrides live in AdPlacementRule.
 */

import type { PlacementCode } from "@/lib/ads/types";
import { MICROS_PER_AUD, type AdsMicros } from "@/lib/ads/money/micros";

/** Algorithm version recorded on AdAuctionResult. */
export const AUCTION_ALGORITHM_VERSION = "mapable-qa-second-price-v1";

/** Minimal second-price increment (A$0.01 CPM = 10_000 micros). */
export const AUCTION_INCREMENT_MICROS: AdsMicros = 10_000n;

/** Quality score bounds as milli-units (1000 = 1.0). Range 0.5 → 1.5. */
export const QUALITY_MIN_MILLI = 500;
export const QUALITY_MAX_MILLI = 1500;
export const QUALITY_NEUTRAL_MILLI = 1000;

/** Bayesian CTR priors (aggregate only — never per-person). */
export const CTR_PRIOR_CLICKS = 1;
export const CTR_PRIOR_IMPRESSIONS = 100;
/** Clamp predicted CTR (ratio). */
export const CTR_MIN = 0.001;
export const CTR_MAX = 0.25;
/** Fixed-point scale: 1.0 CTR = 1_000_000 ppm. */
export const CTR_PPM_SCALE = 1_000_000n;

/** Pacing: allow entry when actualSpendFraction <= targetSpendFraction * (1 + slack). */
export const PACING_OVER_SLACK = 0.15;
export const PACING_SEED_SALT = "mapable-ads-pacing-v1";

/** Development default placement floors (CPM micros). Operator-configurable via rules. */
export const DEFAULT_PLACEMENT_FLOOR_CPM_MICROS: Record<
  PlacementCode,
  AdsMicros
> = {
  "access.map.sponsored-marker": 16n * MICROS_PER_AUD,
  "access.map.sponsored-card": 18n * MICROS_PER_AUD,
  "access.map.bottom-sheet": 18n * MICROS_PER_AUD,
  "access.results.inline": 20n * MICROS_PER_AUD,
  "provider-finder.map.sponsored-card": 24n * MICROS_PER_AUD,
  "provider-finder.results.inline": 28n * MICROS_PER_AUD,
  "provider-finder.sidebar": 24n * MICROS_PER_AUD,
};

export const ADS_TOPUP_MIN_CENTS = 10_000; // A$100
export const ADS_TOPUP_PRESETS_CENTS = [
  10_000, 25_000, 50_000, 100_000, 250_000,
] as const;

export const ADS_WALLET_CURRENCY = "AUD";

export const MAPABLE_PURPOSE_ADS_WALLET_TOPUP = "ads_wallet_topup";
