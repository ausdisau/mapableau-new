/**
 * Pure RAG evaluator — mission invariants 1–12.
 * Deterministic; no network I/O; never writes AccessPlace / Compatibility.
 */
import { ACCESS_SIGNALS_RULE_VERSION } from "./ruleset";
import type {
  RagEvaluationResult,
  RagFeatureAssessmentInput,
  RagObservation,
  RagRouteAssessmentInput,
  RagStatus,
} from "./types";

function hasFlag(
  observations: RagObservation[],
  flag: RagObservation["flags"][number],
): boolean {
  return observations.some((item) => item.flags.includes(flag));
}

function evidenceRefs(observations: RagObservation[]): string[] {
  return observations.map((item) => item.id);
}

/**
 * Evaluate a single feature/zone subject.
 *
 * Invariants (summarised):
 * 1. No evidence ≠ Green
 * 2. Icon/label ≠ rating
 * 3. Unknown critical blocks route Green (handled at route level)
 * 4. Barrier → Red for that segment
 * 5. Verified alternative may change route conclusion without clearing barrier
 * 6. Amber only with documented conditions
 * 7. No averaging across subjects
 * 8. NA excluded with reason
 * 9. Stale/disputed → reassessment (unknown)
 * 10. Temporary outage separate from permanent barrier
 * 11. AI cannot verify
 * 12. Deterministic replay
 */
export function evaluateFeature(
  input: RagFeatureAssessmentInput,
): RagEvaluationResult {
  const limitations: string[] = [];
  const unresolved: string[] = [];

  if (input.applicability === "not_applicable") {
    return {
      status: "unknown",
      applicability: "not_applicable",
      explanation:
        input.notApplicableReason ??
        "Feature marked not applicable and excluded from route aggregation.",
      evidenceRefs: evidenceRefs(input.observations),
      ruleVersion: ACCESS_SIGNALS_RULE_VERSION,
      unresolvedQuestions: [],
      operationalConditions: input.operationalConditions,
      aggregated: false,
      limitations: ["Not applicable subjects are excluded with an explicit reason."],
    };
  }

  if (input.observations.length === 0) {
    return {
      status: "unknown",
      applicability: "applicable",
      explanation: "No evidence on record — cannot rate this feature Green.",
      evidenceRefs: [],
      ruleVersion: ACCESS_SIGNALS_RULE_VERSION,
      unresolvedQuestions: ["Collect assessor or organisation evidence for this feature."],
      operationalConditions: input.operationalConditions,
      aggregated: false,
      limitations: ["Absence of evidence is not accessibility."],
    };
  }

  if (hasFlag(input.observations, "ai_inferred")) {
    limitations.push("AI-inferred observations cannot verify accessibility.");
  }
  if (hasFlag(input.observations, "unverified_legacy_import")) {
    limitations.push("Legacy import remains unverified.");
  }

  if (
    hasFlag(input.observations, "disputed") ||
    hasFlag(input.observations, "outdated")
  ) {
    return {
      status: "unknown",
      applicability: "applicable",
      explanation:
        "Evidence is disputed or outdated — reassessment required before any Green claim.",
      evidenceRefs: evidenceRefs(input.observations),
      ruleVersion: ACCESS_SIGNALS_RULE_VERSION,
      unresolvedQuestions: ["Schedule reassessment with fresh observations."],
      operationalConditions: input.operationalConditions,
      aggregated: false,
      limitations,
    };
  }

  const temporaryOutages = input.operationalConditions.filter(
    (condition) => condition.kind === "temporary_outage" || condition.temporary,
  );
  if (temporaryOutages.length > 0 && !input.barrierPresent) {
    return {
      status: "amber",
      applicability: "applicable",
      explanation:
        "Temporary operational outage recorded. This is separate from a permanent barrier rating.",
      evidenceRefs: evidenceRefs(input.observations),
      ruleVersion: ACCESS_SIGNALS_RULE_VERSION,
      unresolvedQuestions: ["Confirm when the temporary condition clears."],
      operationalConditions: input.operationalConditions,
      aggregated: false,
      limitations: [
        ...limitations,
        "Temporary outages do not permanently clear or set barrier status.",
      ],
    };
  }

  if (input.barrierPresent) {
    return {
      status: "red",
      applicability: "applicable",
      explanation:
        "A barrier is recorded for this segment. Verified alternatives may change a route conclusion without clearing this barrier.",
      evidenceRefs: evidenceRefs(input.observations),
      ruleVersion: ACCESS_SIGNALS_RULE_VERSION,
      unresolvedQuestions: unresolved,
      operationalConditions: input.operationalConditions,
      aggregated: false,
      limitations,
    };
  }

  if (hasFlag(input.observations, "ai_inferred") && !hasFlag(input.observations, "verified")) {
    return {
      status: "unknown",
      applicability: "applicable",
      explanation: "AI inference without independent verification cannot yield Green.",
      evidenceRefs: evidenceRefs(input.observations),
      ruleVersion: ACCESS_SIGNALS_RULE_VERSION,
      unresolvedQuestions: ["Obtain human-verified observation."],
      operationalConditions: input.operationalConditions,
      aggregated: false,
      limitations,
    };
  }

  const onlyCommunity =
    input.observations.every((item) =>
      item.flags.includes("community_reported") || item.flags.includes("synthetic"),
    ) && !hasFlag(input.observations, "verified") && !hasFlag(input.observations, "assessor_observed");

  if (onlyCommunity) {
    if (input.documentedConditions && input.documentedConditions.length > 0) {
      return {
        status: "amber",
        applicability: "applicable",
        explanation: `Amber with documented conditions: ${input.documentedConditions.join("; ")}`,
        evidenceRefs: evidenceRefs(input.observations),
        ruleVersion: ACCESS_SIGNALS_RULE_VERSION,
        unresolvedQuestions: ["Seek assessor verification for Green."],
        operationalConditions: input.operationalConditions,
        aggregated: false,
        limitations,
      };
    }
    return {
      status: "unknown",
      applicability: "applicable",
      explanation:
        "Community or synthetic reports alone are not a verified rating (icon/label ≠ rating).",
      evidenceRefs: evidenceRefs(input.observations),
      ruleVersion: ACCESS_SIGNALS_RULE_VERSION,
      unresolvedQuestions: ["Add assessor-observed or verified evidence."],
      operationalConditions: input.operationalConditions,
      aggregated: false,
      limitations,
    };
  }

  if (
    hasFlag(input.observations, "verified") ||
    hasFlag(input.observations, "assessor_observed")
  ) {
    if (input.documentedConditions && input.documentedConditions.length > 0) {
      return {
        status: "amber",
        applicability: "applicable",
        explanation: `Assessed with conditions: ${input.documentedConditions.join("; ")}`,
        evidenceRefs: evidenceRefs(input.observations),
        ruleVersion: ACCESS_SIGNALS_RULE_VERSION,
        unresolvedQuestions: [],
        operationalConditions: input.operationalConditions,
        aggregated: false,
        limitations,
      };
    }
    return {
      status: "green",
      applicability: "applicable",
      explanation: "Assessed criteria met with verified or assessor-observed evidence.",
      evidenceRefs: evidenceRefs(input.observations),
      ruleVersion: ACCESS_SIGNALS_RULE_VERSION,
      unresolvedQuestions: [],
      operationalConditions: input.operationalConditions,
      aggregated: false,
      limitations,
    };
  }

  return {
    status: "unknown",
    applicability: "applicable",
    explanation: "Evidence present but insufficient to rate Green.",
    evidenceRefs: evidenceRefs(input.observations),
    ruleVersion: ACCESS_SIGNALS_RULE_VERSION,
    unresolvedQuestions: ["Clarify verification status of observations."],
    operationalConditions: input.operationalConditions,
    aggregated: false,
    limitations,
  };
}

function priority(status: RagStatus): number {
  switch (status) {
    case "red":
      return 3;
    case "amber":
      return 2;
    case "unknown":
      return 1;
    case "green":
      return 0;
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function evaluateRoute(
  route: RagRouteAssessmentInput,
  featureResults: Map<string, RagEvaluationResult>,
  featureInputs: Map<string, RagFeatureAssessmentInput>,
): RagEvaluationResult {
  if (!route.networkComplete) {
    return {
      status: "unknown",
      applicability: "applicable",
      explanation:
        "Incomplete network — insufficient evidence. Missing edges/nodes are not invented.",
      evidenceRefs: [],
      ruleVersion: ACCESS_SIGNALS_RULE_VERSION,
      unresolvedQuestions: ["Complete the synthetic network topology before routing claims."],
      operationalConditions: [],
      aggregated: false,
      limitations: ["Incomplete graph ≠ accessible route."],
    };
  }

  const applicable: RagEvaluationResult[] = [];
  let criticalUnknown = false;
  let barrierOnSegment = false;
  const verifiedAlternatives: string[] = [];

  for (const featureId of route.segmentFeatureIds) {
    const input = featureInputs.get(featureId);
    const result = featureResults.get(featureId);
    if (!input || !result) {
      return {
        status: "unknown",
        applicability: "applicable",
        explanation: `Missing assessment for segment ${featureId} — insufficient evidence.`,
        evidenceRefs: [],
        ruleVersion: ACCESS_SIGNALS_RULE_VERSION,
        unresolvedQuestions: [`Assess feature ${featureId}.`],
        operationalConditions: [],
        aggregated: false,
        limitations: [],
      };
    }
    if (result.applicability === "not_applicable") continue;
    applicable.push(result);
    if (input.critical && result.status === "unknown") criticalUnknown = true;
    if (input.barrierPresent || result.status === "red") barrierOnSegment = true;
    for (const alt of input.verifiedAlternativeIds ?? []) {
      verifiedAlternatives.push(alt);
    }
  }

  if (applicable.length === 0) {
    return {
      status: "unknown",
      applicability: "applicable",
      explanation: "No applicable segments after NA exclusions.",
      evidenceRefs: [],
      ruleVersion: ACCESS_SIGNALS_RULE_VERSION,
      unresolvedQuestions: ["Confirm route composition."],
      operationalConditions: [],
      aggregated: false,
      limitations: ["NA subjects were excluded with reasons at feature level."],
    };
  }

  // Worst applicable status — never average.
  let worst: RagStatus = "green";
  for (const item of applicable) {
    if (priority(item.status) > priority(worst)) worst = item.status;
  }

  if (criticalUnknown) {
    return {
      status: "unknown",
      applicability: "applicable",
      explanation:
        "A critical segment is Unknown — route cannot be Green until that evidence is resolved.",
      evidenceRefs: applicable.flatMap((item) => item.evidenceRefs),
      ruleVersion: ACCESS_SIGNALS_RULE_VERSION,
      unresolvedQuestions: ["Resolve critical unknown segments."],
      operationalConditions: [],
      aggregated: false,
      limitations: ["Critical unknown blocks route Green (invariant 3)."],
    };
  }

  if (barrierOnSegment && verifiedAlternatives.length > 0) {
    return {
      status: "amber",
      applicability: "applicable",
      explanation:
        "A barrier remains on a segment, but a verified alternative exists. Route conclusion may change without clearing the original barrier.",
      evidenceRefs: applicable.flatMap((item) => item.evidenceRefs),
      ruleVersion: ACCESS_SIGNALS_RULE_VERSION,
      unresolvedQuestions: [],
      operationalConditions: [],
      aggregated: false,
      limitations: [
        `Verified alternatives: ${verifiedAlternatives.join(", ")}`,
        "Original barrier status is unchanged.",
      ],
    };
  }

  if (barrierOnSegment) {
    return {
      status: "red",
      applicability: "applicable",
      explanation: "At least one route segment has a barrier with no verified alternative.",
      evidenceRefs: applicable.flatMap((item) => item.evidenceRefs),
      ruleVersion: ACCESS_SIGNALS_RULE_VERSION,
      unresolvedQuestions: [],
      operationalConditions: [],
      aggregated: false,
      limitations: [],
    };
  }

  return {
    status: worst,
    applicability: "applicable",
    explanation: `Route conclusion follows worst applicable segment (${worst}) — statuses are never averaged.`,
    evidenceRefs: applicable.flatMap((item) => item.evidenceRefs),
    ruleVersion: ACCESS_SIGNALS_RULE_VERSION,
    unresolvedQuestions: applicable.flatMap((item) => item.unresolvedQuestions),
    operationalConditions: [],
    aggregated: false,
    limitations: [],
  };
}
