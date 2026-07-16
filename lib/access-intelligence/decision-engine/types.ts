import type { AccessDecision, MatchExplanation } from "../schemas";

/** Explicit finding used by explainability UI and APIs. */
export type DecisionFinding = {
  code: string;
  featureType?: string;
  importance?: string;
  message: string;
  evidenceIds: string[];
};

export type AlternativeOption = {
  id: string;
  label: string;
  reason: string;
};

export type ExplainedAccessDecision = AccessDecision & {
  findings: {
    blockers: DecisionFinding[];
    conditions: DecisionFinding[];
    unknowns: DecisionFinding[];
    matchedPreferences: DecisionFinding[];
  };
  explanationSummary: string;
};

export function matchToFinding(m: MatchExplanation): DecisionFinding {
  return {
    code: `${m.outcome}:${m.featureType}`,
    featureType: m.featureType,
    importance: m.importance,
    message: m.explanation,
    evidenceIds: m.evidenceIds,
  };
}
