import { ontologyLabel } from "../ontology";
import type { AccessFeature, AccessRequirement } from "../schemas";

export type RequirementEvaluation = {
  requirementId: string;
  featureType: string;
  importance: AccessRequirement["importance"];
  outcome: "matched" | "failed" | "unknown";
  explanation: string;
  evidenceIds: string[];
};

function matches(feature: AccessFeature, requirement: AccessRequirement): boolean {
  switch (requirement.operator) {
    case "available":
      return (
        feature.value === true ||
        feature.value === "available" ||
        feature.value === requirement.value
      );
    case "equals":
      return String(feature.value) === String(requirement.value);
    case "includes":
      return String(feature.value)
        .toLowerCase()
        .includes(String(requirement.value).toLowerCase());
    case "minimum":
      return Number(feature.value) >= Number(requirement.value);
    case "maximum":
      return Number(feature.value) <= Number(requirement.value);
    default: {
      const _never: never = requirement.operator;
      return _never;
    }
  }
}

/** Evaluate a single passport requirement against claims. */
export function evaluateRequirement(
  requirement: AccessRequirement,
  features: AccessFeature[],
): RequirementEvaluation {
  const label = ontologyLabel(requirement.featureType);
  const candidates = features.filter((f) => f.featureType === requirement.featureType);

  if (candidates.length === 0) {
    return {
      requirementId: requirement.id,
      featureType: requirement.featureType,
      importance: requirement.importance,
      outcome: "unknown",
      explanation: `No evidence found for ${label}.`,
      evidenceIds: [],
    };
  }

  const disputedOnly = candidates.every((c) => c.disputed);
  if (disputedOnly) {
    return {
      requirementId: requirement.id,
      featureType: requirement.featureType,
      importance: requirement.importance,
      outcome: "unknown",
      explanation: `Evidence for ${label} is disputed.`,
      evidenceIds: candidates.flatMap((c) => c.evidenceIds),
    };
  }

  const usable = candidates.filter((c) => !c.disputed);
  // Presence features: any confirming element is a match (e.g. one step-free entrance).
  if (requirement.operator === "available" || requirement.operator === "includes") {
    const best = usable.find((c) => matches(c, requirement));
    if (best) {
      return {
        requirementId: requirement.id,
        featureType: requirement.featureType,
        importance: requirement.importance,
        outcome: "matched",
        explanation: `Confirmed: ${label} meets ${requirement.operator} ${String(requirement.value)}${requirement.unit ? ` ${requirement.unit}` : ""}.`,
        evidenceIds: best.evidenceIds,
      };
    }
  }

  const values = new Set(usable.map((c) => String(c.value)));
  if (values.size > 1 && requirement.operator !== "available") {
    const anyPass = usable.some((c) => matches(c, requirement));
    const anyFail = usable.some((c) => !matches(c, requirement));
    if (anyPass && anyFail) {
      return {
        requirementId: requirement.id,
        featureType: requirement.featureType,
        importance: requirement.importance,
        outcome: "unknown",
        explanation: `Conflicting evidence for ${label}.`,
        evidenceIds: usable.flatMap((c) => c.evidenceIds),
      };
    }
  }

  const best = usable.find((c) => matches(c, requirement));
  if (best) {
    return {
      requirementId: requirement.id,
      featureType: requirement.featureType,
      importance: requirement.importance,
      outcome: "matched",
      explanation: `Confirmed: ${label} meets ${requirement.operator} ${String(requirement.value)}${requirement.unit ? ` ${requirement.unit}` : ""}.`,
      evidenceIds: best.evidenceIds,
    };
  }

  return {
    requirementId: requirement.id,
    featureType: requirement.featureType,
    importance: requirement.importance,
    outcome: "failed",
    explanation: `Confirmed failure: ${label} does not meet ${requirement.operator} ${String(requirement.value)}${requirement.unit ? ` ${requirement.unit}` : ""}.`,
    evidenceIds: usable[0]?.evidenceIds ?? [],
  };
}
