import { randomUUID } from "crypto";

import type {
  AccessCompatibilityState,
  AccessCriticality,
} from "./domains";
import type {
  AccessAdjustment,
  AccessCapability,
  AccessCompatibility,
  AccessRequirement,
} from "./types";

export type RequirementNeedResult =
  | "MATCH"
  | "MISMATCH"
  | "UNKNOWN"
  | "ADJUSTMENT_AVAILABLE";

export type CompatibilityEngineInput = {
  passportId: string;
  entityType: AccessCompatibility["entityType"];
  entityId: string;
  journeyId?: string | null;
  activity?: string | null;
  requirements: AccessRequirement[];
  capabilities: AccessCapability[];
  adjustments?: AccessAdjustment[];
  /** When true, requirements with disclosureScopes that exclude the caller are treated as revoked for this evaluation. */
  revokedDisclosureConceptIds?: string[];
};

export type CompatibilityEngineResult = AccessCompatibility & {
  decisionOwner: "PARTICIPANT";
  needResults: Array<{
    requirementId: string;
    ontologyConceptId: string;
    criticality: AccessCriticality;
    result: RequirementNeedResult;
  }>;
};

const WEAK_STATUSES = new Set([
  "unknown",
  "outdated",
  "disputed",
]);

function compareValues(
  comparator: AccessRequirement["comparator"],
  required: string | number | boolean | undefined,
  actual: string | number | boolean,
): boolean | null {
  if (required === undefined) {
    // Presence of a true/affirmative capability is enough when no value specified.
    if (typeof actual === "boolean") return actual === true;
    return true;
  }
  const op = comparator ?? "eq";
  switch (op) {
    case "eq":
      return actual === required;
    case "neq":
      return actual !== required;
    case "gte":
      return typeof actual === "number" && typeof required === "number"
        ? actual >= required
        : null;
    case "lte":
      return typeof actual === "number" && typeof required === "number"
        ? actual <= required
        : null;
    case "gt":
      return typeof actual === "number" && typeof required === "number"
        ? actual > required
        : null;
    case "lt":
      return typeof actual === "number" && typeof required === "number"
        ? actual < required
        : null;
    case "includes":
      return String(actual).includes(String(required));
    default: {
      const _exhaustive: never = op;
      return _exhaustive;
    }
  }
}

function evaluateNeed(
  requirement: AccessRequirement,
  capabilities: AccessCapability[],
  adjustments: AccessAdjustment[],
  revoked: Set<string>,
): RequirementNeedResult {
  if (revoked.has(requirement.ontologyConceptId)) {
    return "UNKNOWN";
  }

  const matches = capabilities.filter(
    (c) => c.ontologyConceptId === requirement.ontologyConceptId,
  );

  if (matches.length === 0) {
    const adjustment = adjustments.find(
      (a) =>
        a.ontologyConceptId === requirement.ontologyConceptId ||
        requirement.acceptableAdjustmentIds?.includes(a.id),
    );
    if (adjustment) return "ADJUSTMENT_AVAILABLE";
    return "UNKNOWN";
  }

  // Prefer strongest non-weak evidence; never collapse unknown → yes/no.
  const decisive = matches.filter((c) => !WEAK_STATUSES.has(c.status));
  if (decisive.length === 0) {
    return "UNKNOWN";
  }

  let anyMatch = false;
  let anyMismatch = false;
  for (const cap of decisive) {
    const cmp = compareValues(requirement.comparator, requirement.value, cap.value);
    if (cmp === null) {
      return "UNKNOWN";
    }
    if (cmp) anyMatch = true;
    else anyMismatch = true;
  }

  if (anyMismatch && !anyMatch) {
    const adjustment = adjustments.find(
      (a) =>
        a.ontologyConceptId === requirement.ontologyConceptId ||
        requirement.acceptableAdjustmentIds?.includes(a.id),
    );
    if (adjustment) return "ADJUSTMENT_AVAILABLE";
    return "MISMATCH";
  }
  if (anyMatch) return "MATCH";
  return "UNKNOWN";
}

function appliesInContext(
  requirement: AccessRequirement,
  activity?: string | null,
): boolean {
  if (requirement.contextScope === "always") return true;
  if (requirement.contextScope === "activity_specific") {
    return Boolean(activity);
  }
  // journey_specific: include when no journey filter is applied at place-level demo
  return true;
}

/**
 * Deterministic Access Compatibility Engine.
 * Never returns a universal percentage score.
 * The system proposes; the participant decides.
 */
export function evaluateCompatibility(
  input: CompatibilityEngineInput,
): CompatibilityEngineResult {
  const adjustments = input.adjustments ?? [];
  const revoked = new Set(input.revokedDisclosureConceptIds ?? []);

  const requiredMet: string[] = [];
  const requiredUnmet: string[] = [];
  const requiredUncertain: string[] = [];
  const preferenceMet: string[] = [];
  const preferenceUnmet: string[] = [];
  const preferenceUncertain: string[] = [];
  const adjustmentIds = new Set<string>();
  const evidenceRefs = new Set<string>();
  const limitations: string[] = [];
  const needResults: CompatibilityEngineResult["needResults"] = [];

  let hasRequiredMismatch = false;
  let hasRequiredUnknown = false;
  let hasRequiredAdjustment = false;

  for (const requirement of input.requirements) {
    if (!appliesInContext(requirement, input.activity)) {
      continue;
    }

    const result = evaluateNeed(
      requirement,
      input.capabilities,
      adjustments,
      revoked,
    );
    needResults.push({
      requirementId: requirement.id,
      ontologyConceptId: requirement.ontologyConceptId,
      criticality: requirement.criticality,
      result,
    });

    const matchingCaps = input.capabilities.filter(
      (c) => c.ontologyConceptId === requirement.ontologyConceptId,
    );
    for (const c of matchingCaps) {
      evidenceRefs.add(c.evidenceObservationId);
    }

    const isRequired = requirement.criticality === "required";
    const bucketMet = isRequired ? requiredMet : preferenceMet;
    const bucketUnmet = isRequired ? requiredUnmet : preferenceUnmet;
    const bucketUncertain = isRequired ? requiredUncertain : preferenceUncertain;

    switch (result) {
      case "MATCH":
        bucketMet.push(requirement.ontologyConceptId);
        break;
      case "MISMATCH":
        bucketUnmet.push(requirement.ontologyConceptId);
        if (isRequired) hasRequiredMismatch = true;
        else {
          limitations.push(
            `Preference not met: ${requirement.ontologyConceptId}`,
          );
        }
        break;
      case "UNKNOWN":
        bucketUncertain.push(requirement.ontologyConceptId);
        if (isRequired) hasRequiredUnknown = true;
        break;
      case "ADJUSTMENT_AVAILABLE": {
        bucketUncertain.push(requirement.ontologyConceptId);
        const adj = adjustments.find(
          (a) =>
            a.ontologyConceptId === requirement.ontologyConceptId ||
            requirement.acceptableAdjustmentIds?.includes(a.id),
        );
        if (adj) adjustmentIds.add(adj.id);
        if (isRequired) hasRequiredAdjustment = true;
        break;
      }
      default: {
        const _exhaustive: never = result;
        return _exhaustive;
      }
    }
  }

  let state: AccessCompatibilityState;
  if (hasRequiredMismatch) {
    state = "incompatible";
  } else if (hasRequiredUnknown) {
    state = "uncertain";
  } else if (hasRequiredAdjustment) {
    state = "compatible_with_adjustment";
  } else {
    state = "compatible";
  }

  // Preference-only mismatches never force incompatible.
  if (
    state === "compatible" &&
    preferenceUnmet.length > 0 &&
    requiredMet.length + requiredUncertain.length + requiredUnmet.length === 0
  ) {
    limitations.push("Some preferences are unmet; participant decides.");
  }

  return {
    id: randomUUID(),
    passportId: input.passportId,
    entityType: input.entityType,
    entityId: input.entityId,
    journeyId: input.journeyId ?? null,
    state,
    requiredMetConceptIds: requiredMet,
    requiredUnmetConceptIds: requiredUnmet,
    requiredUncertainConceptIds: requiredUncertain,
    preferenceMetConceptIds: preferenceMet,
    preferenceUnmetConceptIds: preferenceUnmet,
    preferenceUncertainConceptIds: preferenceUncertain,
    adjustmentIds: [...adjustmentIds],
    evidenceRefs: [...evidenceRefs],
    limitations,
    participantDecisionRequired: true,
    evaluatedAt: new Date().toISOString(),
    decisionOwner: "PARTICIPANT",
    needResults,
  };
}

export function toCompatibilityApiResponse(
  result: CompatibilityEngineResult,
  adjustments: AccessAdjustment[] = [],
) {
  return {
    schemaVersion: "1.0" as const,
    id: result.id,
    passportId: result.passportId,
    entityType: result.entityType,
    entityId: result.entityId,
    journeyId: result.journeyId ?? null,
    state: result.state,
    required: {
      met: result.requiredMetConceptIds,
      unmet: result.requiredUnmetConceptIds,
      uncertain: result.requiredUncertainConceptIds,
    },
    preferences: {
      met: result.preferenceMetConceptIds,
      unmet: result.preferenceUnmetConceptIds,
      uncertain: result.preferenceUncertainConceptIds,
    },
    adjustments: adjustments
      .filter((a) => result.adjustmentIds.includes(a.id))
      .map((a) => ({ id: a.id, summary: a.summary })),
    evidenceRefs: result.evidenceRefs,
    limitations: result.limitations,
    participantDecisionRequired: true as const,
    decisionOwner: "PARTICIPANT" as const,
    evaluatedAt: result.evaluatedAt,
    needResults: result.needResults,
  };
}
