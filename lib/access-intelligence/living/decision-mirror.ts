import type { DecisionStatus } from "../schemas";

import type { LearningTraceEvent } from "./schemas";

export type DecisionMirrorReport = {
  initialPrediction: DecisionStatus | null;
  finalDecision: DecisionStatus | null;
  confidenceChange: number | null;
  evidenceInspectedCount: number;
  evidenceIdsInspected: string[];
  hardRequirementOverlooked: boolean;
  unknownTreatedAsPresent: boolean;
  unknownTreatedAsAbsent: boolean;
  staleEvidenceReliedUpon: boolean;
  liveIncidentConsidered: boolean;
  selectedRouteEligible: boolean | null;
  evidenceThatChangedResult: string[];
  narratableFindings: string[];
};

type MirrorInput = {
  events: LearningTraceEvent[];
  engineFinalStatus: DecisionStatus;
  staleEvidenceIds?: string[];
  hardRequirementFeatureTypes?: string[];
  selectedRouteId?: string | null;
  eligibleRouteIds?: string[];
};

/**
 * Deterministic Decision Mirror — behavioural trace only.
 * Does not invent psychological diagnoses or “bias” labels.
 */
export function buildDecisionMirror(input: MirrorInput): DecisionMirrorReport {
  const prediction = input.events.find((e) => e.type === "prediction_submitted");
  const revision = [...input.events]
    .reverse()
    .find((e) => e.type === "decision_revised");
  const evidenceOpened = input.events.filter((e) => e.type === "evidence_opened");
  const unknownEvents = input.events.filter((e) => e.type === "unknown_classified");
  const routeSelected = [...input.events]
    .reverse()
    .find((e) => e.type === "route_selected");

  const initialPrediction = prediction?.type === "prediction_submitted" ? prediction.status : null;
  const finalDecision =
    revision?.type === "decision_revised"
      ? revision.status
      : input.engineFinalStatus;
  const confidenceChange =
    prediction?.type === "prediction_submitted" && revision?.type === "decision_revised"
      ? revision.confidence - prediction.confidence
      : prediction?.type === "prediction_submitted"
        ? null
        : null;

  const unknownTreatedAsPresent = unknownEvents.some(
    (e) => e.type === "unknown_classified" && e.classification === "present",
  );
  const unknownTreatedAsAbsent = unknownEvents.some(
    (e) => e.type === "unknown_classified" && e.classification === "absent",
  );

  const evidenceIdsInspected = evidenceOpened.map((e) =>
    e.type === "evidence_opened" ? e.evidenceId : "",
  );
  const staleEvidenceReliedUpon = (input.staleEvidenceIds ?? []).some((id) =>
    evidenceIdsInspected.includes(id),
  );

  const liveIncidentConsidered = input.events.some(
    (e) =>
      (e.type === "evidence_opened" && e.evidenceId.includes("lift")) ||
      (e.type === "route_selected" && e.routeId.includes("west")),
  );

  const selectedRouteEligible =
    routeSelected?.type === "route_selected"
      ? (input.eligibleRouteIds ?? []).includes(routeSelected.routeId) ||
        routeSelected.routeId.includes("west") ||
        routeSelected.routeId.includes("main")
      : null;

  const hardRequirementOverlooked =
    Boolean(initialPrediction === "suitable") &&
    (input.engineFinalStatus === "blocked" || input.engineFinalStatus === "unknown");

  const evidenceThatChangedResult: string[] = [];
  if (initialPrediction && initialPrediction !== finalDecision) {
    evidenceThatChangedResult.push(
      ...evidenceIdsInspected.slice(0, 5),
    );
  }

  const narratableFindings: string[] = [];
  if (prediction?.type === "prediction_submitted") {
    narratableFindings.push(
      `You initially selected ${statusLabel(prediction.status)} before completing investigation (confidence ${prediction.confidence}%).`,
    );
  }
  if (hardRequirementOverlooked) {
    narratableFindings.push(
      "Your early prediction did not match a confirmed hard requirement outcome from the deterministic engine.",
    );
  }
  if (unknownTreatedAsPresent) {
    narratableFindings.push(
      "You classified at least one unknown feature as present. Unknown must stay unknown until evidence confirms it.",
    );
  }
  if (unknownTreatedAsAbsent) {
    narratableFindings.push(
      "You classified at least one unknown feature as absent without confirmed negative evidence.",
    );
  }
  if (staleEvidenceReliedUpon) {
    narratableFindings.push(
      "You opened stale evidence. Freshness affects confidence; stale items need re-verification for operational claims.",
    );
  }
  if (liveIncidentConsidered) {
    narratableFindings.push("You considered live lift / western route information during revision.");
  }
  if (routeSelected?.type === "route_selected") {
    narratableFindings.push(`Selected route identifier: ${routeSelected.routeId}.`);
  }
  narratableFindings.push(
    `Deterministic engine final status: ${statusLabel(input.engineFinalStatus)}.`,
  );

  return {
    initialPrediction,
    finalDecision,
    confidenceChange,
    evidenceInspectedCount: evidenceIdsInspected.length,
    evidenceIdsInspected,
    hardRequirementOverlooked,
    unknownTreatedAsPresent,
    unknownTreatedAsAbsent,
    staleEvidenceReliedUpon,
    liveIncidentConsidered,
    selectedRouteEligible,
    evidenceThatChangedResult,
    narratableFindings,
  };
}

function statusLabel(status: DecisionStatus): string {
  switch (status) {
    case "suitable":
      return "Suitable";
    case "suitable_with_conditions":
      return "Suitable with conditions";
    case "blocked":
      return "Blocked";
    case "unknown":
      return "Information incomplete";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}
