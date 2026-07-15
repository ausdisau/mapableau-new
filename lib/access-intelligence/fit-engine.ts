import { calculateEvidenceConfidence } from "./confidence-engine";
import { importanceWeights } from "./configuration";
import type {
  AccessDecision,
  AccessFeature,
  AccessPassport,
  AccessRequirement,
  Evidence,
  LiveIncident,
  MatchExplanation,
  Place,
} from "./schemas";

export type FitEngineInput = {
  place: Place;
  passport: AccessPassport;
  features: AccessFeature[];
  evidence: Evidence[];
  incidents?: LiveIncident[];
  now?: Date;
};

function featureMatchesRequirement(
  feature: AccessFeature,
  requirement: AccessRequirement,
): boolean {
  const { operator, value } = requirement;
  switch (operator) {
    case "available":
      return feature.value === true || feature.value === "available" || feature.value === value;
    case "equals":
      return String(feature.value) === String(value);
    case "includes":
      return String(feature.value)
        .toLowerCase()
        .includes(String(value).toLowerCase());
    case "minimum":
      return Number(feature.value) >= Number(value);
    case "maximum":
      return Number(feature.value) <= Number(value);
    default: {
      const _exhaustive: never = operator;
      return _exhaustive;
    }
  }
}

function findFeaturesForRequirement(
  features: AccessFeature[],
  requirement: AccessRequirement,
): AccessFeature[] {
  return features.filter((f) => f.featureType === requirement.featureType);
}

function evaluateRequirement(
  requirement: AccessRequirement,
  features: AccessFeature[],
): MatchExplanation {
  const matches = findFeaturesForRequirement(features, requirement);
  if (matches.length === 0) {
    return {
      requirementId: requirement.id,
      featureType: requirement.featureType,
      importance: requirement.importance,
      outcome: "unknown",
      explanation: `No evidence found for ${requirement.featureType.replaceAll("_", " ")}.`,
      evidenceIds: [],
    };
  }

  const disputed = matches.filter((m) => m.disputed);
  const nonDisputed = matches.filter((m) => !m.disputed);

  if (disputed.length > 0 && nonDisputed.length === 0) {
    return {
      requirementId: requirement.id,
      featureType: requirement.featureType,
      importance: requirement.importance,
      outcome: "unknown",
      explanation: `Evidence for ${requirement.featureType.replaceAll("_", " ")} is disputed.`,
      evidenceIds: disputed.flatMap((m) => m.evidenceIds),
    };
  }

  // Conflict across non-disputed values
  if (nonDisputed.length >= 2) {
    const values = new Set(nonDisputed.map((m) => String(m.value)));
    if (values.size > 1) {
      const anyPass = nonDisputed.some((m) =>
        featureMatchesRequirement(m, requirement),
      );
      const anyFail = nonDisputed.some(
        (m) => !featureMatchesRequirement(m, requirement),
      );
      if (anyPass && anyFail) {
        return {
          requirementId: requirement.id,
          featureType: requirement.featureType,
          importance: requirement.importance,
          outcome: "unknown",
          explanation: `Conflicting evidence for ${requirement.featureType.replaceAll("_", " ")}.`,
          evidenceIds: nonDisputed.flatMap((m) => m.evidenceIds),
        };
      }
    }
  }

  const candidates = nonDisputed.length > 0 ? nonDisputed : matches;
  const best = candidates.find((m) => featureMatchesRequirement(m, requirement));
  if (best) {
    return {
      requirementId: requirement.id,
      featureType: requirement.featureType,
      importance: requirement.importance,
      outcome: "matched",
      explanation: `Confirmed: ${requirement.featureType.replaceAll("_", " ")} meets ${requirement.operator} ${String(requirement.value)}${requirement.unit ? ` ${requirement.unit}` : ""}.`,
      evidenceIds: best.evidenceIds,
    };
  }

  // Explicit negative (available false / value fails)
  const explicitFail = candidates.find((m) => {
    if (requirement.operator === "available") {
      return m.value === false || m.value === "unavailable";
    }
    return true;
  });

  return {
    requirementId: requirement.id,
    featureType: requirement.featureType,
    importance: requirement.importance,
    outcome: "failed",
    explanation: `Confirmed failure: ${requirement.featureType.replaceAll("_", " ")} does not meet ${requirement.operator} ${String(requirement.value)}${requirement.unit ? ` ${requirement.unit}` : ""}${explicitFail ? ` (observed ${String(explicitFail.value)})` : ""}.`,
    evidenceIds: explicitFail?.evidenceIds ?? candidates[0]?.evidenceIds ?? [],
  };
}

function liveConditions(
  incidents: LiveIncident[] | undefined,
): { conditions: string[]; reliability: number } {
  const active = (incidents ?? []).filter((i) => i.status === "active");
  if (active.length === 0) {
    return { conditions: [], reliability: 95 };
  }
  const conditions = active.map(
    (i) => `Live: ${i.description} (${i.severity}, ${i.type.replaceAll("_", " ")})`,
  );
  const reliability = Math.max(
    20,
    95 - active.length * 15 - (active.some((i) => i.severity === "critical") ? 20 : 0),
  );
  return { conditions, reliability };
}

/**
 * Deterministic personal fit. Never infers requirements from a diagnosis.
 * Required requirements are gates; preferred/helpful only affect the fit score.
 */
export function calculatePersonalFit(input: FitEngineInput): AccessDecision {
  const now = input.now ?? new Date();
  const explanations = input.passport.requirements.map((req) =>
    evaluateRequirement(req, input.features),
  );

  const blockers: string[] = [];
  const unknowns: string[] = [];
  const conditions: string[] = [];
  const evidenceIds = new Set<string>();

  for (const exp of explanations) {
    for (const id of exp.evidenceIds) evidenceIds.add(id);
    if (exp.importance === "required") {
      if (exp.outcome === "failed") blockers.push(exp.explanation);
      if (exp.outcome === "unknown") unknowns.push(exp.explanation);
    } else if (exp.outcome === "failed") {
      conditions.push(
        `${exp.importance === "preferred" ? "Preferred" : "Helpful"} not met: ${exp.explanation}`,
      );
    } else if (exp.outcome === "unknown" && exp.importance === "preferred") {
      conditions.push(`Preferred feature unverified: ${exp.explanation}`);
    }
  }

  const live = liveConditions(input.incidents);
  conditions.push(...live.conditions);

  let status: AccessDecision["status"];
  if (blockers.length > 0) {
    status = "blocked";
  } else if (unknowns.length > 0) {
    status = "unknown";
  } else if (conditions.length > 0) {
    status = "suitable_with_conditions";
  } else {
    status = "suitable";
  }

  // Preference fit only after required evaluation
  const preferenceReqs = input.passport.requirements.filter(
    (r) => r.importance !== "required",
  );
  let personalFit: number | null = null;
  if (preferenceReqs.length > 0) {
    let earned = 0;
    let possible = 0;
    for (const req of preferenceReqs) {
      const weight = importanceWeights[req.importance];
      possible += weight;
      const exp = explanations.find((e) => e.requirementId === req.id);
      if (exp?.outcome === "matched") earned += weight;
    }
    personalFit =
      possible === 0 ? 100 : Math.round((earned / possible) * 100);
  } else if (status === "suitable" || status === "suitable_with_conditions") {
    personalFit = 100;
  } else if (status === "blocked") {
    personalFit = 0;
  } else {
    personalFit = null;
  }

  const confidence = calculateEvidenceConfidence({
    features: input.features,
    evidence: input.evidence,
    now,
    coverageExpectedFeatureTypes: input.passport.requirements.map(
      (r) => r.featureType,
    ),
  });

  return {
    placeId: input.place.id,
    status,
    baselineScore: input.place.baselineScore ?? null,
    personalFit,
    evidenceConfidence: confidence.numeric,
    evidenceConfidenceLabel: confidence.label,
    liveReliability: live.reliability,
    blockers,
    conditions,
    unknowns,
    matchedRequirements: explanations,
    alternatives: [],
    evidenceIds: [...evidenceIds],
    recommendedRouteId: null,
    generatedAt: now.toISOString(),
  };
}
