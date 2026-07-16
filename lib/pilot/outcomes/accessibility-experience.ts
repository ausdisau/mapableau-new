export type AccessibilityExperienceScore = {
  journey: string;
  passed: boolean;
  notes?: string;
};

export function summariseAccessibilityExperience(
  scores: readonly AccessibilityExperienceScore[]
): { passRate: number; failedJourneys: string[] } {
  if (scores.length === 0) return { passRate: 0, failedJourneys: [] };
  const failed = scores.filter((s) => !s.passed).map((s) => s.journey);
  return {
    passRate: (scores.length - failed.length) / scores.length,
    failedJourneys: failed,
  };
}
