import type {
  AccessMarkerDomainScores,
  AccessMarkerRatingInput,
} from "@/lib/access-markers/types";

/** Convert a 1–5 rating to 0–100. Values ≤ 0 are treated as unknown. */
export function ratingToPercent(value: number | null | undefined): number | null {
  if (value == null || value <= 0) return null;
  if (value > 5) return 100;
  return Math.round(value * 20);
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function collectKnown(...values: Array<number | null | undefined>): number[] {
  return values
    .map((v) => ratingToPercent(v))
    .filter((v): v is number => v != null);
}

export function computeDomainScoresFromRatings(
  ratings: AccessMarkerRatingInput[]
): AccessMarkerDomainScores {
  const overall = collectKnown(...ratings.map((r) => r.overallRating));
  const mobility = collectKnown(...ratings.map((r) => r.mobilityRating));
  const toilet = collectKnown(...ratings.map((r) => r.toiletRating));
  const parking = collectKnown(...ratings.map((r) => r.parkingDropoffRating));
  const sensory = collectKnown(...ratings.map((r) => r.sensoryRating));
  const communication = collectKnown(...ratings.map((r) => r.communicationRating));
  const staff = collectKnown(...ratings.map((r) => r.staffServiceRating));

  const domainAverages = {
    mobilityScore: average(mobility),
    toiletScore: average(toilet),
    parkingDropoffScore: average(parking),
    sensoryScore: average(sensory),
    communicationScore: average(communication),
    staffServiceScore: average(staff),
  };

  const knownDomains = Object.values(domainAverages).filter((s) => s > 0);
  const overallFromDomains = average(knownDomains);
  const overallScore =
    overall.length > 0 ? average(overall) : overallFromDomains;

  return {
    overallScore,
    ...domainAverages,
  };
}

export type ConfidenceInputs = {
  ratingCount: number;
  verifiedCount: number;
  disputedCount: number;
  photoCount?: number;
  lastRatedAt?: Date | string | null;
  now?: Date;
};

/**
 * Confidence 0–100 from recency, sample size, verifications, photos, disputes.
 */
export function computeConfidenceScore(input: ConfidenceInputs): number {
  const now = input.now ?? new Date();
  let score = 0;

  score += Math.min(40, input.ratingCount * 8);
  score += Math.min(20, input.verifiedCount * 5);
  score += Math.min(10, (input.photoCount ?? 0) * 5);

  if (input.lastRatedAt) {
    const last =
      typeof input.lastRatedAt === "string"
        ? new Date(input.lastRatedAt)
        : input.lastRatedAt;
    const days = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
    if (days <= 90) score += 25;
    else if (days <= 180) score += 12;
    else if (days <= 365) score += 5;
  }

  score -= Math.min(score, input.disputedCount * 10);
  return Math.max(0, Math.min(100, Math.round(score)));
}
