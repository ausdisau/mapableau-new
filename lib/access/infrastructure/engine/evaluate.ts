import type {
  AccessAdjustment,
  AccessCapability,
  AccessCompatibilityState,
  AccessCriticality,
  AccessProvenanceStatus,
  AccessRequirement,
} from "@/lib/access/infrastructure";

export type FindingResult =
  | "match"
  | "mismatch"
  | "unknown"
  | "adjustment_available";

export type CompatibilityFinding = {
  requirementId: string;
  ontologyConceptId: string;
  criticality: AccessCriticality;
  result: FindingResult;
  capabilityId?: string;
  observationId?: string;
  adjustmentId?: string;
  reasonCode: string;
  explanation: string;
  requiresConfirmation: boolean;
};

export type CompatibilityEvaluationInput = {
  passportId: string;
  requirements: AccessRequirement[];
  entityType: string;
  entityId: string;
  capabilities: Array<
    AccessCapability & {
      observationStatus?: AccessProvenanceStatus;
      disputed?: boolean;
      reviewDue?: string | null;
    }
  >;
  adjustments: AccessAdjustment[];
  /** Activity/vertical context filter — requirements with journey_specific/activity_specific may be skipped if mismatched. */
  contextTags?: string[];
  now?: Date;
};

export type CompatibilityEvaluationResult = {
  passportId: string;
  entityType: string;
  entityId: string;
  state: AccessCompatibilityState;
  findings: CompatibilityFinding[];
  requiredMetConceptIds: string[];
  requiredUnmetConceptIds: string[];
  requiredUncertainConceptIds: string[];
  preferenceMetConceptIds: string[];
  preferenceUnmetConceptIds: string[];
  preferenceUncertainConceptIds: string[];
  adjustmentIds: string[];
  evidenceRefs: string[];
  limitations: string[];
  participantDecisionRequired: true;
  decisionOwner: "PARTICIPANT";
  summary: {
    matched: number;
    unknown: number;
    mismatched: number;
    adjustments: number;
  };
};

function valuesCompatible(
  required: string | number | boolean | undefined,
  observed: string | number | boolean,
  comparator?: string,
): boolean {
  if (required === undefined) {
    return observed === true || observed === "true" || observed === 1;
  }
  const cmp = comparator ?? "eq";
  switch (cmp) {
    case "eq":
      return required === observed || String(required) === String(observed);
    case "neq":
      return required !== observed && String(required) !== String(observed);
    case "gte":
      return Number(observed) >= Number(required);
    case "lte":
      return Number(observed) <= Number(required);
    case "gt":
      return Number(observed) > Number(required);
    case "lt":
      return Number(observed) < Number(required);
    case "includes":
      return String(observed).includes(String(required));
    default:
      return required === observed;
  }
}

function evidenceUsable(status?: AccessProvenanceStatus, disputed?: boolean, reviewDue?: string | null, now?: Date): boolean {
  if (disputed) return false;
  if (!status || status === "unknown" || status === "outdated" || status === "disputed") {
    return false;
  }
  if (reviewDue && now && new Date(reviewDue) < now) {
    return false;
  }
  return true;
}

function requirementApplies(
  req: AccessRequirement,
  contextTags?: string[],
): boolean {
  if (req.contextScope === "always") return true;
  if (!contextTags || contextTags.length === 0) return true;
  // Without structured activity tags on the requirement, activity/journey scoped
  // requirements still apply when evaluating (conservative: include them).
  return true;
}

/**
 * Deterministic compatibility evaluation.
 * Never uses an LLM. Never invents a universal score.
 * Unknown must not become match or mismatch.
 */
export function evaluateCompatibility(
  input: CompatibilityEvaluationInput,
): CompatibilityEvaluationResult {
  const now = input.now ?? new Date();
  const findings: CompatibilityFinding[] = [];
  const capsByConcept = new Map<string, (typeof input.capabilities)[number]>();
  for (const cap of input.capabilities) {
    capsByConcept.set(cap.ontologyConceptId, cap);
  }
  const adjustmentsByConcept = new Map<string, AccessAdjustment[]>();
  for (const adj of input.adjustments) {
    if (!adj.ontologyConceptId) continue;
    const list = adjustmentsByConcept.get(adj.ontologyConceptId) ?? [];
    list.push(adj);
    adjustmentsByConcept.set(adj.ontologyConceptId, list);
  }

  const requiredMet: string[] = [];
  const requiredUnmet: string[] = [];
  const requiredUncertain: string[] = [];
  const preferenceMet: string[] = [];
  const preferenceUnmet: string[] = [];
  const preferenceUncertain: string[] = [];
  const adjustmentIds: string[] = [];
  const evidenceRefs: string[] = [];
  const limitations: string[] = [
    "Compatibility is contextual to the participant's confirmed requirements.",
    "Participant remains the decision owner.",
  ];

  for (const req of input.requirements) {
    if (!requirementApplies(req, input.contextTags)) continue;
    if (!req.userConfirmed && req.criticality === "required") {
      // Unconfirmed required still evaluated but flagged for confirmation.
    }

    const cap = capsByConcept.get(req.ontologyConceptId);
    const isRequired = req.criticality === "required";
    const isStrong = req.criticality === "strong_preference";

    if (!cap) {
      const adjList = adjustmentsByConcept.get(req.ontologyConceptId) ?? [];
      const usableAdj = adjList.find((a) =>
        evidenceUsable(a.status, false, null, now),
      );
      if (usableAdj && isRequired) {
        findings.push({
          requirementId: req.id,
          ontologyConceptId: req.ontologyConceptId,
          criticality: req.criticality,
          result: "adjustment_available",
          adjustmentId: usableAdj.id,
          reasonCode: "ADJUSTMENT_AVAILABLE",
          explanation: `No direct capability recorded; adjustment available: ${usableAdj.summary}`,
          requiresConfirmation: true,
        });
        adjustmentIds.push(usableAdj.id);
        requiredUncertain.push(req.ontologyConceptId);
        continue;
      }
      findings.push({
        requirementId: req.id,
        ontologyConceptId: req.ontologyConceptId,
        criticality: req.criticality,
        result: "unknown",
        reasonCode: "MISSING_CAPABILITY",
        explanation: "No current evidence for this access requirement.",
        requiresConfirmation: true,
      });
      if (isRequired) requiredUncertain.push(req.ontologyConceptId);
      else preferenceUncertain.push(req.ontologyConceptId);
      continue;
    }

    evidenceRefs.push(cap.evidenceObservationId);
    const usable = evidenceUsable(
      cap.observationStatus ?? cap.status,
      cap.disputed,
      cap.reviewDue,
      now,
    );

    if (!usable) {
      findings.push({
        requirementId: req.id,
        ontologyConceptId: req.ontologyConceptId,
        criticality: req.criticality,
        result: "unknown",
        capabilityId: cap.id,
        observationId: cap.evidenceObservationId,
        reasonCode: "STALE_OR_DISPUTED_EVIDENCE",
        explanation:
          "Evidence exists but is unknown, outdated, disputed, or past review due date.",
        requiresConfirmation: true,
      });
      if (isRequired) requiredUncertain.push(req.ontologyConceptId);
      else preferenceUncertain.push(req.ontologyConceptId);
      continue;
    }

    const matched = valuesCompatible(req.value, cap.value, req.comparator);
    if (matched) {
      findings.push({
        requirementId: req.id,
        ontologyConceptId: req.ontologyConceptId,
        criticality: req.criticality,
        result: "match",
        capabilityId: cap.id,
        observationId: cap.evidenceObservationId,
        reasonCode: "CAPABILITY_MATCH",
        explanation: "Recorded capability satisfies this requirement.",
        requiresConfirmation: !req.userConfirmed,
      });
      if (isRequired) requiredMet.push(req.ontologyConceptId);
      else preferenceMet.push(req.ontologyConceptId);
      continue;
    }

    const adjList = adjustmentsByConcept.get(req.ontologyConceptId) ?? [];
    const usableAdj = adjList.find((a) => evidenceUsable(a.status, false, null, now));
    if (usableAdj && (isRequired || isStrong)) {
      findings.push({
        requirementId: req.id,
        ontologyConceptId: req.ontologyConceptId,
        criticality: req.criticality,
        result: "adjustment_available",
        capabilityId: cap.id,
        observationId: cap.evidenceObservationId,
        adjustmentId: usableAdj.id,
        reasonCode: "ADJUSTMENT_AVAILABLE",
        explanation: `Capability does not directly match; adjustment available: ${usableAdj.summary}`,
        requiresConfirmation: true,
      });
      adjustmentIds.push(usableAdj.id);
      if (isRequired) requiredUncertain.push(req.ontologyConceptId);
      else preferenceUnmet.push(req.ontologyConceptId);
      continue;
    }

    findings.push({
      requirementId: req.id,
      ontologyConceptId: req.ontologyConceptId,
      criticality: req.criticality,
      result: "mismatch",
      capabilityId: cap.id,
      observationId: cap.evidenceObservationId,
      reasonCode: "CAPABILITY_MISMATCH",
      explanation: "Recorded capability contradicts this requirement.",
      requiresConfirmation: true,
    });
    if (isRequired) requiredUnmet.push(req.ontologyConceptId);
    else preferenceUnmet.push(req.ontologyConceptId);
  }

  const requiredFindings = findings.filter((f) => f.criticality === "required");
  const requiredMismatch = requiredFindings.some((f) => f.result === "mismatch");
  const requiredAdjustment = requiredFindings.some(
    (f) => f.result === "adjustment_available",
  );
  const requiredUnknown = requiredFindings.some((f) => f.result === "unknown");

  let state: AccessCompatibilityState;
  if (requiredMismatch) {
    state = "incompatible";
  } else if (requiredUnknown) {
    state = "uncertain";
  } else if (requiredAdjustment) {
    state = "compatible_with_adjustment";
  } else {
    state = "compatible";
  }

  if (requiredFindings.length === 0 && findings.length === 0) {
    state = "uncertain";
    limitations.push("No confirmed requirements were evaluated.");
  }

  return {
    passportId: input.passportId,
    entityType: input.entityType,
    entityId: input.entityId,
    state,
    findings,
    requiredMetConceptIds: requiredMet,
    requiredUnmetConceptIds: requiredUnmet,
    requiredUncertainConceptIds: requiredUncertain,
    preferenceMetConceptIds: preferenceMet,
    preferenceUnmetConceptIds: preferenceUnmet,
    preferenceUncertainConceptIds: preferenceUncertain,
    adjustmentIds: [...new Set(adjustmentIds)],
    evidenceRefs: [...new Set(evidenceRefs)],
    limitations,
    participantDecisionRequired: true,
    decisionOwner: "PARTICIPANT",
    summary: {
      matched: requiredFindings.filter((f) => f.result === "match").length,
      unknown: requiredFindings.filter((f) => f.result === "unknown").length,
      mismatched: requiredFindings.filter((f) => f.result === "mismatch").length,
      adjustments: requiredFindings.filter((f) => f.result === "adjustment_available")
        .length,
    },
  };
}

/** Participant-facing plain-language summary — no scores. */
export function summariseCompatibilityForParticipant(
  result: CompatibilityEvaluationResult,
): string {
  switch (result.state) {
    case "compatible":
      return `Likely compatible. ${result.summary.matched} required access needs matched. You decide whether to proceed.`;
    case "compatible_with_adjustment":
      return `Compatible with adjustment. ${result.summary.adjustments} adjustment(s) may address a barrier. Confirm before proceeding.`;
    case "uncertain":
      return `Needs more information. ${result.summary.unknown} required need(s) lack current evidence. Unknown does not mean inaccessible.`;
    case "incompatible":
      return `Known mismatch. ${result.summary.mismatched} required need(s) conflict with recorded capabilities. You may still decide how to proceed.`;
    default: {
      const _exhaustive: never = result.state;
      return _exhaustive;
    }
  }
}
