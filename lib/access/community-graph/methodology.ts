export const METHODOLOGY_STRINGS = {
  evidenceCoverage:
    "Ratio of path segments with at least one linked observation in MapAble evidence graph.",
  freshness:
    "Ratio of evidenced segments with observation within the configured recency window.",
  barrierDensity:
    "Barrier-related observations per kilometre of aggregated path length — not a safety score.",
  unknownCoverage:
    "Ratio of segments where key attributes (width, slope, surface) remain unknown.",
  noPeopleScoring:
    "MapAble does not score, rank, or gamify individual contributors in community graph outputs.",
} as const;

export function formatMethodologySummary(): string {
  return Object.entries(METHODOLOGY_STRINGS)
    .map(([key, text]) => `${key}: ${text}`)
    .join("\n");
}
