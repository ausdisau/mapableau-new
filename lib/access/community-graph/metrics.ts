/**
 * Community access graph metrics — NO people scoring.
 */

export type CommunityGraphInput = {
  totalSegments: number;
  segmentsWithEvidence: number;
  segmentsWithRecentEvidence: number;
  staleEvidenceSegments: number;
  barrierObservationCount: number;
  unknownAttributeSegments: number;
  recentObservationWindowDays: number;
};

export type CommunityGraphMetrics = {
  evidenceCoverageRatio: number;
  freshnessRatio: number;
  barrierDensityPerKm: number;
  unknownCoverageRatio: number;
  methodology: string;
};

export const COMMUNITY_GRAPH_METHODOLOGY =
  "Metrics aggregate place/segment evidence only. No individual contributor scores, rankings, or gamification.";

export function computeCommunityGraphMetrics(
  input: CommunityGraphInput,
  totalPathLengthKm: number,
): CommunityGraphMetrics {
  const evidenceCoverageRatio =
    input.totalSegments === 0
      ? 0
      : input.segmentsWithEvidence / input.totalSegments;
  const freshnessRatio =
    input.segmentsWithEvidence === 0
      ? 0
      : input.segmentsWithRecentEvidence / input.segmentsWithEvidence;
  const unknownCoverageRatio =
    input.totalSegments === 0
      ? 0
      : input.unknownAttributeSegments / input.totalSegments;
  const barrierDensityPerKm =
    totalPathLengthKm > 0
      ? input.barrierObservationCount / totalPathLengthKm
      : 0;

  return {
    evidenceCoverageRatio,
    freshnessRatio,
    barrierDensityPerKm,
    unknownCoverageRatio,
    methodology: COMMUNITY_GRAPH_METHODOLOGY,
  };
}

/** Explicit guard — people scoring is prohibited. */
export function assertNoPeopleScoring(metrics: Record<string, unknown>): void {
  const forbidden = [
    "contributorScore",
    "userScore",
    "peopleScore",
    "leaderboard",
    "rankByUser",
  ];
  for (const key of forbidden) {
    if (key in metrics) {
      throw new Error(`People scoring field prohibited: ${key}`);
    }
  }
}
