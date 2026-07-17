import { randomUUID } from "crypto";

import { requireMission } from "../mission/store";
import { appendWitness } from "../witness";
import {
  wave5EvidenceCorrectionsEnabled,
  wave5OutcomeCalibrationEnabled,
} from "../execution/flags";
import { listExecutionsForMission } from "../execution/store";
import type { AuraMissionRecord } from "../mission/store";

export type AuraOutcomeObservation = {
  category:
    | "transport"
    | "entrance"
    | "route"
    | "lift"
    | "toilet"
    | "assistance"
    | "supporter"
    | "communication"
    | "fallback"
    | "other";
  expected: string;
  observed: string;
  result:
    | "matched"
    | "did_not_match"
    | "partly_matched"
    | "not_observed"
    | "unknown";
  source:
    | "participant_report"
    | "application_receipt"
    | "venue_response"
    | "transport_event"
    | "live_status"
    | "moderator_result";
  evidenceReference?: string;
  confidence: number;
};

export type AuraOutcomeRecord = {
  id: string;
  missionId: string;
  participantId: string;
  executionIds: string[];
  planArtifactId: string;
  planVersion: number;
  missionOutcome:
    | "completed"
    | "partially_completed"
    | "not_completed"
    | "cancelled_by_participant"
    | "cancelled_by_service"
    | "not_attempted"
    | "unknown";
  observations: AuraOutcomeObservation[];
  disclosureReview?: {
    appropriate: "yes" | "partly" | "no" | "not_sure";
    comment?: string;
  };
  participantComment?: string;
  createdAt: string;
  updatedAt: string;
  source:
    | "participant_reported"
    | "participant_and_receipts"
    | "verified_external_state";
  researchUseAllowed: boolean;
  analyticsUseAllowed: boolean;
  auditCorrelationId: string;
  skipped?: boolean;
};

export type AuraCalibrationComparison = {
  missionId: string;
  planArtifactId: string;
  outcomeRecordId: string;
  accuratePredictions: string[];
  inaccuratePredictions: string[];
  unresolvedPredictions: string[];
  falseReassuranceDetected: boolean;
  unnecessaryBlockerDetected: boolean;
  staleEvidenceDetected: boolean;
  routeMismatchDetected: boolean;
  disclosureConcernDetected: boolean;
  humanReviewRequired: boolean;
  reviewReasons: string[];
  generatedAt: string;
};

export type AuraEvidenceCorrectionProposal = {
  id: string;
  missionId: string;
  outcomeRecordId: string;
  placeId: string;
  elementId?: string;
  featureType?: string;
  correctionType: string;
  currentClaimReference?: string;
  proposedObservation: string;
  source:
    | "participant_report"
    | "verified_execution_receipt"
    | "venue_response"
    | "transport_event"
    | "live_status";
  evidenceReferences: string[];
  confidence: number;
  participantApprovedForSubmission: boolean;
  state:
    | "draft"
    | "ready_for_review"
    | "submitted_to_moderation"
    | "accepted"
    | "rejected"
    | "needs_more_information"
    | "cancelled";
  createdAt: string;
};

const outcomes = new Map<string, AuraOutcomeRecord>();
const comparisons = new Map<string, AuraCalibrationComparison>();
const corrections = new Map<string, AuraEvidenceCorrectionProposal>();

export function resetCalibrationStore(): void {
  outcomes.clear();
  comparisons.clear();
  corrections.clear();
}

function assertOutcomeEnabled(): void {
  if (!wave5OutcomeCalibrationEnabled()) {
    throw new Error("MAPABLE_AURA_OUTCOME_CALIBRATION_DISABLED");
  }
}

export function recordOutcome(input: {
  missionId: string;
  participantId: string;
  missionOutcome?: AuraOutcomeRecord["missionOutcome"];
  observations?: AuraOutcomeObservation[];
  disclosureReview?: AuraOutcomeRecord["disclosureReview"];
  participantComment?: string;
  skipped?: boolean;
}): AuraOutcomeRecord {
  if (input.skipped) {
    const mission = requireMission(input.missionId);
    appendWitness({
      missionId: mission.id,
      type: "outcome.skipped",
      summary: "Participant skipped outcome review",
      correlationId: mission.correlationId,
      actorType: "participant",
      actorId: input.participantId,
    });
    return {
      id: randomUUID(),
      missionId: input.missionId,
      participantId: input.participantId,
      executionIds: [],
      planArtifactId: mission.plan?.id ?? "",
      planVersion: mission.planVersions?.at(-1)?.version ?? 1,
      missionOutcome: "unknown",
      observations: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: "participant_reported",
      researchUseAllowed: false,
      analyticsUseAllowed: false,
      auditCorrelationId: mission.correlationId,
      skipped: true,
    };
  }

  assertOutcomeEnabled();
  const mission = requireMission(input.missionId);
  if (mission.participantId !== input.participantId) {
    throw new Error("AURA_MISSION_FORBIDDEN");
  }

  const executions = listExecutionsForMission(input.missionId);
  const record: AuraOutcomeRecord = {
    id: randomUUID(),
    missionId: input.missionId,
    participantId: input.participantId,
    executionIds: executions.map((e) => e.id),
    planArtifactId: mission.plan?.id ?? "",
    planVersion: mission.planVersions?.at(-1)?.version ?? 1,
    missionOutcome: input.missionOutcome ?? "unknown",
    observations: input.observations ?? [],
    disclosureReview: input.disclosureReview,
    participantComment: input.participantComment,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: executions.length
      ? "participant_and_receipts"
      : "participant_reported",
    researchUseAllowed: false,
    analyticsUseAllowed: false,
    auditCorrelationId: mission.correlationId,
  };
  outcomes.set(record.id, record);
  appendWitness({
    missionId: mission.id,
    type: "outcome.recorded",
    summary: `Outcome recorded: ${record.missionOutcome}`,
    correlationId: mission.correlationId,
    actorType: "participant",
    actorId: input.participantId,
    payload: { outcomeId: record.id },
  });
  return record;
}

export function getOutcomeForMission(missionId: string): AuraOutcomeRecord | null {
  return (
    [...outcomes.values()]
      .filter((o) => o.missionId === missionId)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0] ??
    null
  );
}

export function comparePredictedVsObserved(
  mission: AuraMissionRecord,
  outcome: AuraOutcomeRecord,
): AuraCalibrationComparison {
  assertOutcomeEnabled();
  const plan = mission.plan;
  const accurate: string[] = [];
  const inaccurate: string[] = [];
  const unresolved: string[] = [];

  for (const obs of outcome.observations) {
    if (obs.result === "matched") accurate.push(`${obs.category}: ${obs.expected}`);
    else if (obs.result === "did_not_match" || obs.result === "partly_matched") {
      inaccurate.push(`${obs.category}: expected ${obs.expected}, observed ${obs.observed}`);
    } else unresolved.push(`${obs.category}: ${obs.expected}`);
  }

  const toiletObs = outcome.observations.find((o) => o.category === "toilet");
  const planToiletUnknown =
    mission.unknowns?.some((u) => u.toLowerCase().includes("toilet")) ||
    plan?.unknowns?.some((u) => u.toLowerCase().includes("toilet"));
  const falseReassuranceDetected =
    Boolean(planToiletUnknown) &&
    toiletObs?.result === "did_not_match" &&
    toiletObs.observed.toLowerCase().includes("unavailable");

  const routeMismatchDetected = outcome.observations.some(
    (o) => o.category === "route" && o.result === "did_not_match",
  );
  const disclosureConcernDetected =
    outcome.disclosureReview?.appropriate === "no" ||
    outcome.disclosureReview?.appropriate === "partly";

  const comparison: AuraCalibrationComparison = {
    missionId: mission.id,
    planArtifactId: outcome.planArtifactId,
    outcomeRecordId: outcome.id,
    accuratePredictions: accurate,
    inaccuratePredictions: inaccurate,
    unresolvedPredictions: unresolved,
    falseReassuranceDetected,
    unnecessaryBlockerDetected: false,
    staleEvidenceDetected: inaccurate.some((i) => i.includes("stale")),
    routeMismatchDetected,
    disclosureConcernDetected,
    humanReviewRequired: falseReassuranceDetected || disclosureConcernDetected,
    reviewReasons: [
      ...(falseReassuranceDetected ? ["false_reassurance"] : []),
      ...(disclosureConcernDetected ? ["disclosure_concern"] : []),
      ...(routeMismatchDetected ? ["route_mismatch"] : []),
    ],
    generatedAt: new Date().toISOString(),
  };
  comparisons.set(`${mission.id}:${outcome.id}`, comparison);

  appendWitness({
    missionId: mission.id,
    type: falseReassuranceDetected
      ? "outcome.false_reassurance_detected"
      : "outcome.prediction_compared",
    summary: "Predicted versus observed comparison generated",
    correlationId: mission.correlationId,
    payload: {
      comparison,
      humanReviewRequired: comparison.humanReviewRequired,
    },
  });

  if (comparison.humanReviewRequired) {
    appendWitness({
      missionId: mission.id,
      type: "outcome.human_review_required",
      summary: comparison.reviewReasons.join(", "),
      correlationId: mission.correlationId,
    });
  }

  return comparison;
}

export function createEvidenceCorrectionDraft(input: {
  missionId: string;
  outcomeRecordId: string;
  placeId: string;
  correctionType: string;
  proposedObservation: string;
  elementId?: string;
  featureType?: string;
}): AuraEvidenceCorrectionProposal {
  if (!wave5EvidenceCorrectionsEnabled()) {
    throw new Error("MAPABLE_AURA_EVIDENCE_CORRECTIONS_DISABLED");
  }
  const draft: AuraEvidenceCorrectionProposal = {
    id: randomUUID(),
    missionId: input.missionId,
    outcomeRecordId: input.outcomeRecordId,
    placeId: input.placeId,
    elementId: input.elementId,
    featureType: input.featureType,
    correctionType: input.correctionType,
    proposedObservation: input.proposedObservation,
    source: "participant_report",
    evidenceReferences: [],
    confidence: 0.7,
    participantApprovedForSubmission: false,
    state: "draft",
    createdAt: new Date().toISOString(),
  };
  corrections.set(draft.id, draft);
  appendWitness({
    missionId: input.missionId,
    type: "evidence_correction.created",
    summary: input.correctionType,
    correlationId: input.missionId,
    payload: { correctionId: draft.id },
  });
  return draft;
}

export function submitEvidenceCorrection(
  correctionId: string,
  participantId: string,
): AuraEvidenceCorrectionProposal {
  const c = corrections.get(correctionId);
  if (!c) throw new Error("AURA_CORRECTION_NOT_FOUND");
  const mission = requireMission(c.missionId);
  if (mission.participantId !== participantId) {
    throw new Error("AURA_MISSION_FORBIDDEN");
  }
  const updated = {
    ...c,
    participantApprovedForSubmission: true,
    state: "submitted_to_moderation" as const,
  };
  corrections.set(correctionId, updated);
  appendWitness({
    missionId: c.missionId,
    type: "evidence_correction.submitted",
    summary: "Correction submitted to moderation (not auto-published)",
    correlationId: mission.correlationId,
    actorType: "participant",
    actorId: participantId,
    payload: { correctionId },
  });
  return updated;
}

export function listCorrectionsForMission(
  missionId: string,
): AuraEvidenceCorrectionProposal[] {
  return [...corrections.values()].filter((c) => c.missionId === missionId);
}

export function getCalibrationComparison(
  missionId: string,
  outcomeRecordId: string,
): AuraCalibrationComparison | null {
  return comparisons.get(`${missionId}:${outcomeRecordId}`) ?? null;
}
