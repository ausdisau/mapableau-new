import type {
  DecisionPoint,
  LearningScenario,
  PracticeSession,
  RubricCriterion,
  RubricDimension,
  RubricEvaluation,
} from "./schemas";

const HINTS = {
  prompt: "What requirement must be true before you call this visit suitable?",
  point_evidence:
    "Open the evidence workspace and check dates, source types, and disputed claims before deciding.",
  explanation:
    "Required absences block the visit; missing evidence stays unknown — never upgrade unknown to a fact; preferences do not create blockers.",
} as const;

export function getHint(level: 1 | 2 | 3): { level: number; text: string } {
  if (level === 1) return { level: 1, text: HINTS.prompt };
  if (level === 2) return { level: 2, text: HINTS.point_evidence };
  return { level: 3, text: HINTS.explanation };
}

export function evaluateDecisionAgainstRubric(input: {
  scenario: LearningScenario;
  session: PracticeSession;
  decisionPoint: DecisionPoint;
}): RubricEvaluation {
  const { scenario, session, decisionPoint } = input;
  const chosen =
    session.revisionOptionId ??
    session.decisionOptionId ??
    session.predictionOptionId;
  const scores: Record<RubricDimension, number> = {
    requirement_recognition: 0,
    evidence_reasoning: 0,
    uncertainty_handling: 0,
    route_and_contingency: 0,
    consent_rights_privacy_communication: 0,
  };
  const feedback: string[] = [];

  const matchedExpected = chosen === decisionPoint.expectedOptionId;
  scores.requirement_recognition = matchedExpected ? 100 : 40;
  feedback.push(
    matchedExpected
      ? "You recognised the decision that matches required functional needs."
      : `Expected decision was “${decisionPoint.options.find((o) => o.id === decisionPoint.expectedOptionId)?.label ?? decisionPoint.expectedOptionId}”. ${decisionPoint.rationale}`,
  );

  scores.evidence_reasoning = session.evidenceRevealed ? 90 : 35;
  feedback.push(
    session.evidenceRevealed
      ? "You inspected evidence before locking a final judgement."
      : "Inspect evidence source, date, and verification before deciding.",
  );

  const choseUnknownAware = decisionPoint.options.find((o) => o.id === chosen)
    ?.predictedStatus;
  scores.uncertainty_handling =
    choseUnknownAware === "unknown" ||
    choseUnknownAware === "suitable_with_conditions" ||
    matchedExpected
      ? 85
      : 45;
  if (scenario.unknownHighlights.length > 0) {
    feedback.push(
      matchedExpected
        ? "You treated unknowns carefully rather than inventing facts."
        : `Remember unknowns: ${scenario.unknownHighlights.join("; ")}`,
    );
  }

  scores.route_and_contingency = session.eventTriggered || matchedExpected ? 80 : 50;
  feedback.push(
    "Contingencies matter when live conditions change — re-check before travel.",
  );

  const teachBackOk = evaluateTeachBackText(
    session.teachBackText ?? "",
    scenario.teachBackKeywords,
  );
  scores.consent_rights_privacy_communication = teachBackOk.passed ? 90 : 55;
  feedback.push(...teachBackOk.feedback);

  // Weight by criteria if present
  let weighted = 0;
  let totalWeight = 0;
  for (const criterion of scenario.rubric as RubricCriterion[]) {
    const dimScore = scores[criterion.dimension];
    weighted += dimScore * criterion.weight;
    totalWeight += criterion.weight;
  }
  const overallPercent =
    totalWeight === 0
      ? Math.round(
          Object.values(scores).reduce((a, b) => a + b, 0) /
            Object.keys(scores).length,
        )
      : Math.round(weighted / totalWeight);

  return {
    sessionId: session.id,
    scenarioId: scenario.id,
    dimensionScores: scores,
    overallPercent,
    feedback,
    passed: overallPercent >= 60 && matchedExpected,
    evaluatedAt: new Date().toISOString(),
  };
}

export function evaluateTeachBackText(
  text: string,
  keywords: string[],
): { passed: boolean; matched: string[]; feedback: string[] } {
  const lower = text.toLowerCase();
  const matched = keywords.filter((k) => lower.includes(k.toLowerCase()));
  const needed = Math.max(2, Math.ceil(keywords.length * 0.4));
  const passed = matched.length >= needed && text.trim().length >= 40;
  const feedback = [
    passed
      ? "Teach-back covered key concepts in your own words."
      : `Teach-back needs more of these ideas: ${keywords.join(", ")}. Do not claim formal professional competence.`,
  ];
  return { passed, matched, feedback };
}

export function nextMasteryLevel(
  current: "introduced" | "developing" | "independent" | "can_explain_to_others",
  evaluation: RubricEvaluation,
  teachBackPassed: boolean,
): typeof current {
  if (evaluation.overallPercent >= 85 && teachBackPassed) {
    if (current === "independent" || current === "can_explain_to_others") {
      return "can_explain_to_others";
    }
    if (current === "developing") return "independent";
    return "developing";
  }
  if (evaluation.overallPercent >= 60) {
    if (current === "introduced") return "developing";
    return current;
  }
  return current === "introduced" ? "introduced" : current;
}
