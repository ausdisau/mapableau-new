import { randomUUID } from "crypto";

import { requireMission, type AuraMissionRecord } from "@/lib/aura/mission/store";
import {
  wave5EvidenceCorrectionsEnabled,
  wave5OutcomeCalibrationEnabled,
} from "@/lib/aura/wave5-flags";
import { appendWitness } from "@/lib/aura/witness";

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
  proposedObservation: string;
  source: "participant_report";
  evidenceReferences: string[];
  confidence: number;
  participantApprovedForSubmission: boolean;
  state: "draft" | "submitted_to_moderation";
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

/**
 * Record a mission outcome for calibration.
 * Always enforces mission.participantId === input.participantId (incl. skipped).
 * Skipped outcomes are persisted to the in-memory store (Wave 5 fix).
 */
export function recordOutcome(input: {
  missionId: string;
  participantId: string;
  missionOutcome?: AuraOutcomeRecord["missionOutcome"];
  observations?: AuraOutcomeObservation[];
  disclosureReview?: AuraOutcomeRecord["disclosureReview"];
  participantComment?: string;
  skipped?: boolean;
}): AuraOutcomeRecord {
  const mission = requireMission(input.missionId);
  // Unconditional ownership guard — prevents session hijacking / spoofed participantId.
  if (mission.participantId !== input.participantId) {
    throw new Error("AURA_MISSION_FORBIDDEN");
  }

  if (input.skipped) {
    assertOutcomeEnabled();
    const record: AuraOutcomeRecord = {
      id: randomUUID(),
      missionId: input.missionId,
      participantId: input.participantId,
      executionIds: [],
      planArtifactId: mission.plan?.id ?? "",
      planVersion: mission.planVersions?.at(-1)?.version ?? 1,
      missionOutcome: "unknown",
      observations: [],
      participantComment: input.participantComment,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: "participant_reported",
      researchUseAllowed: false,
      analyticsUseAllowed: false,
      auditCorrelationId: mission.correlationId,
      skipped: true,
    };
    outcomes.set(record.id, record);
    appendWitness({
      missionId: mission.id,
      type: "outcome.skipped",
      summary: "Participant skipped outcome review",
      correlationId: mission.correlationId,
      actorType: "participant",
      actorId: input.participantId,
      payload: { outcomeId: record.id },
    });
    return record;
  }

  assertOutcomeEnabled();

  const record: AuraOutcomeRecord = {
    id: randomUUID(),
    missionId: input.missionId,
    participantId: input.participantId,
    executionIds: [],
    planArtifactId: mission.plan?.id ?? "",
    planVersion: mission.planVersions?.at(-1)?.version ?? 1,
    missionOutcome: input.missionOutcome ?? "unknown",
    observations: input.observations ?? [],
    disclosureReview: input.disclosureReview,
    participantComment: input.participantComment,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: "participant_reported",
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
  const accurate: string[] = [];
  const inaccurate: string[] = [];
  const unresolved: string[] = [];

  for (const obs of outcome.observations) {
    if (obs.result === "matched") accurate.push(`${obs.category}: ${obs.expected}`);
    else if (obs.result === "did_not_match" || obs.result === "partly_matched") {
      inaccurate.push(
        `${obs.category}: expected ${obs.expected}, observed ${obs.observed}`,
      );
    } else unresolved.push(`${obs.category}: ${obs.expected}`);
  }

  const toiletObs = outcome.observations.find((o) => o.category === "toilet");
  const planToiletUnknown =
    mission.unknowns?.some((u) => u.toLowerCase().includes("toilet")) ||
    mission.plan?.unknowns?.some((u) => u.toLowerCase().includes("toilet"));
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
  return draft;
}

export function getCalibrationComparison(
  missionId: string,
  outcomeRecordId: string,
): AuraCalibrationComparison | null {
  return comparisons.get(`${missionId}:${outcomeRecordId}`) ?? null;
}

export function listCorrectionsForMission(
  missionId: string,
): AuraEvidenceCorrectionProposal[] {
  return [...corrections.values()].filter((c) => c.missionId === missionId);
}
