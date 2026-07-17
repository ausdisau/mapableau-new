const FORBIDDEN_PARTICIPATION_SCORE_KEYS = [
  "loneliness",
  "engagement",
  "attendance",
  "social_isolation",
] as const;

export function isParticipationScoreForbidden(metricKey: string): boolean {
  const normalised = metricKey.toLowerCase();
  return FORBIDDEN_PARTICIPATION_SCORE_KEYS.some((key) =>
    normalised.includes(key),
  );
}

export function assertParticipationScoreAllowed(metricKey: string): never {
  if (isParticipationScoreForbidden(metricKey)) {
    throw new Error(`PARTICIPATION_SCORE_FORBIDDEN:${metricKey}`);
  }
  throw new Error("PARTICIPATION_SCORING_NOT_SUPPORTED");
}
