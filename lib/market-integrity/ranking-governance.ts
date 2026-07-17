/**
 * Ranking governance — MapAble does NOT allow paid boosts to override the
 * ranking of providers presented to participants. Sponsored content must be
 * clearly labelled and appears in a distinct area, never inside the organic
 * search results list.
 */

export interface RankingSignals {
  qualitySignals: number;
  accessibilityFit: number;
  distancePenalty: number;
  waitTimePenalty: number;
  sponsoredBoost?: number;
}

export interface RankingResult {
  score: number;
  usedSponsoredBoost: boolean;
}

export function computeOrganicScore(signals: RankingSignals): RankingResult {
  const score =
    signals.qualitySignals * 0.5 +
    signals.accessibilityFit * 0.3 -
    signals.distancePenalty * 0.1 -
    signals.waitTimePenalty * 0.1;
  return { score, usedSponsoredBoost: false };
}

export function assertNoSponsoredBoostInOrganic(signals: RankingSignals): void {
  if (typeof signals.sponsoredBoost === "number" && signals.sponsoredBoost !== 0) {
    throw new Error("SPONSORED_BOOST_NOT_ALLOWED_IN_ORGANIC");
  }
}
