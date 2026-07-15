import { calculatePersonalFit } from "../fit-engine";
import type { FitEngineInput } from "../fit-engine";
import type { AccessDecision } from "../schemas";

import { matchToFinding, type ExplainedAccessDecision } from "./types";

export type { FitEngineInput };

/**
 * Deterministic personal-fit evaluation.
 * Venue baselineScore is returned for context but never drives status alone.
 */
export function calculatePersonalFitDecision(
  input: FitEngineInput,
): AccessDecision {
  if (!input.passport) {
    return {
      placeId: input.place.id,
      status: "unknown",
      baselineScore: input.place.baselineScore ?? null,
      personalFit: null,
      evidenceConfidence: 0,
      evidenceConfidenceLabel: "very limited",
      liveReliability: 0,
      blockers: [],
      conditions: [],
      unknowns: ["No Access Passport is selected."],
      matchedRequirements: [],
      alternatives: [],
      evidenceIds: [],
      recommendedRouteId: null,
      generatedAt: new Date().toISOString(),
    };
  }
  return calculatePersonalFit(input);
}

export function explainDecision(decision: AccessDecision): ExplainedAccessDecision {
  const blockers = decision.matchedRequirements
    .filter((m) => m.importance === "required" && m.outcome === "failed")
    .map(matchToFinding);
  const unknowns = decision.matchedRequirements
    .filter((m) => m.importance === "required" && m.outcome === "unknown")
    .map(matchToFinding);
  const matchedPreferences = decision.matchedRequirements
    .filter((m) => m.importance !== "required" && m.outcome === "matched")
    .map(matchToFinding);
  const conditions = [
    ...decision.matchedRequirements
      .filter(
        (m) =>
          m.importance !== "required" &&
          (m.outcome === "failed" || m.outcome === "unknown"),
      )
      .map(matchToFinding),
    ...decision.conditions.map((message, i) => ({
      code: `condition:${i}`,
      message,
      evidenceIds: [] as string[],
    })),
  ];

  const explanationSummary =
    decision.status === "blocked"
      ? `Blocked. ${decision.blockers[0] ?? "A required feature is confirmed absent."}`
      : decision.status === "unknown"
        ? `Information incomplete. ${decision.unknowns[0] ?? "Required evidence is missing."}`
        : decision.status === "suitable_with_conditions"
          ? `Suitable with conditions. ${decision.conditions[0] ?? "Review conditions before travelling."}`
          : "Suitable. Required features are confirmed for this passport.";

  return {
    ...decision,
    findings: {
      blockers:
        blockers.length > 0
          ? blockers
          : decision.blockers.map((message, i) => ({
              code: `blocker:${i}`,
              message,
              evidenceIds: [],
            })),
      conditions,
      unknowns:
        unknowns.length > 0
          ? unknowns
          : decision.unknowns.map((message, i) => ({
              code: `unknown:${i}`,
              message,
              evidenceIds: [],
            })),
      matchedPreferences,
    },
    explanationSummary,
  };
}
