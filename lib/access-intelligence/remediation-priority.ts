/**
 * Remediation priority for Venue Studio.
 * Transparent factors — not an objective universal truth.
 */

export type RemediationAssumptions = {
  peopleAffected: number;
  barrierSeverity: number; // 1–5
  journeyFrequency: number; // 1–5
  evidenceConfidence: number; // 0–1
  estimatedEffort: number; // 1–5 (higher = harder)
};

export type RemediationPriorityResult = {
  priority: number;
  formula: string;
  factors: RemediationAssumptions;
  explanation: string;
};

export function calculateRemediationPriority(
  assumptions: RemediationAssumptions,
): RemediationPriorityResult {
  const effort = Math.max(1, assumptions.estimatedEffort);
  const priority =
    (assumptions.peopleAffected *
      assumptions.barrierSeverity *
      assumptions.journeyFrequency *
      Math.max(0.05, assumptions.evidenceConfidence)) /
    effort;

  return {
    priority: Math.round(priority * 100) / 100,
    formula:
      "priority = peopleAffected × barrierSeverity × journeyFrequency × evidenceConfidence ÷ estimatedEffort",
    factors: assumptions,
    explanation: `Estimated priority ${Math.round(priority * 100) / 100} using editable assumptions. This is a planning heuristic for discussion, not an objective ranking of human need.`,
  };
}
