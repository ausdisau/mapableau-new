import { mapConclusionToCompatibility } from "@/lib/access/infrastructure/compatibility";
import type {
  AccessCapability,
  AccessRequirement,
} from "@/lib/access/infrastructure/types";
import type { AccessCompatibilityState } from "@/lib/access/infrastructure/domains";
import type { AccessConclusionState } from "@/lib/access/intelligence-next/results/states";

export type PassportCompatibilityGap = {
  ontologyConceptId: string;
  criticality: AccessRequirement["criticality"];
  outcome: "met" | "unmet" | "uncertain";
  reason: string;
};

export type PassportCompatibilityProjection = {
  state: AccessCompatibilityState;
  requiredMet: string[];
  requiredUnmet: string[];
  requiredUncertain: string[];
  preferenceMet: string[];
  preferenceUnmet: string[];
  preferenceUncertain: string[];
  gaps: PassportCompatibilityGap[];
  limitations: string[];
  participantDecisionRequired: boolean;
};

function capabilityIndex(
  capabilities: AccessCapability[],
): Map<string, AccessCapability[]> {
  const index = new Map<string, AccessCapability[]>();
  for (const cap of capabilities) {
    const list = index.get(cap.ontologyConceptId) ?? [];
    list.push(cap);
    index.set(cap.ontologyConceptId, list);
  }
  return index;
}

function evaluateRequirementAgainstCapabilities(
  requirement: AccessRequirement,
  caps: AccessCapability[] | undefined,
): "met" | "unmet" | "uncertain" {
  if (!caps || caps.length === 0) {
    return "uncertain";
  }

  const latest = caps[caps.length - 1];
  if (
    latest.status === "unknown" ||
    latest.status === "outdated" ||
    latest.status === "disputed"
  ) {
    return "uncertain";
  }

  if (requirement.comparator && requirement.value !== undefined) {
    const observed = latest.value;
    const required = requirement.value;
    switch (requirement.comparator) {
      case "eq":
        return observed === required ? "met" : "unmet";
      case "gte":
        return typeof observed === "number" && typeof required === "number" &&
          observed >= required
          ? "met"
          : "unmet";
      case "lte":
        return typeof observed === "number" && typeof required === "number" &&
          observed <= required
          ? "met"
          : "unmet";
      default:
        return observed === required ? "met" : "uncertain";
    }
  }

  if (typeof latest.value === "boolean") {
    return latest.value ? "met" : "unmet";
  }

  return "uncertain";
}

function worstCompatibilityState(
  states: AccessCompatibilityState[],
): AccessCompatibilityState {
  if (states.includes("incompatible")) return "incompatible";
  if (states.includes("uncertain")) return "uncertain";
  if (states.includes("compatible_with_adjustment")) {
    return "compatible_with_adjustment";
  }
  return "compatible";
}

export function projectPassportCompatibility(input: {
  requirements: AccessRequirement[];
  capabilities: AccessCapability[];
}): PassportCompatibilityProjection {
  const index = capabilityIndex(input.capabilities);
  const requiredMet: string[] = [];
  const requiredUnmet: string[] = [];
  const requiredUncertain: string[] = [];
  const preferenceMet: string[] = [];
  const preferenceUnmet: string[] = [];
  const preferenceUncertain: string[] = [];
  const gaps: PassportCompatibilityGap[] = [];
  const stateOutcomes: AccessCompatibilityState[] = [];

  for (const requirement of input.requirements) {
    const caps = index.get(requirement.ontologyConceptId);
    const outcome = evaluateRequirementAgainstCapabilities(requirement, caps);
    const isRequired = requirement.criticality === "required";

    const bucket = isRequired
      ? { met: requiredMet, unmet: requiredUnmet, uncertain: requiredUncertain }
      : {
          met: preferenceMet,
          unmet: preferenceUnmet,
          uncertain: preferenceUncertain,
        };

    if (outcome === "met") bucket.met.push(requirement.ontologyConceptId);
    else if (outcome === "unmet") bucket.unmet.push(requirement.ontologyConceptId);
    else bucket.uncertain.push(requirement.ontologyConceptId);

    gaps.push({
      ontologyConceptId: requirement.ontologyConceptId,
      criticality: requirement.criticality,
      outcome,
      reason:
        outcome === "uncertain"
          ? "Insufficient or stale evidence for this requirement"
          : outcome === "unmet"
            ? "Observed capability does not meet requirement"
            : "Requirement satisfied by observed capability",
    });

    const conclusion: AccessConclusionState =
      outcome === "met"
        ? "compatible"
        : outcome === "unmet"
          ? isRequired
            ? "incompatible"
            : "fallback_available"
          : "cannot_confirm";

    stateOutcomes.push(mapConclusionToCompatibility(conclusion));
  }

  const limitations: string[] = [];
  if (requiredUncertain.length > 0) {
    limitations.push(
      `${requiredUncertain.length} required feature(s) have unknown evidence — not treated as accessible.`,
    );
  }

  return {
    state: worstCompatibilityState(stateOutcomes),
    requiredMet,
    requiredUnmet,
    requiredUncertain,
    preferenceMet,
    preferenceUnmet,
    preferenceUncertain,
    gaps,
    limitations,
    participantDecisionRequired:
      requiredUncertain.length > 0 || requiredUnmet.length > 0,
  };
}
