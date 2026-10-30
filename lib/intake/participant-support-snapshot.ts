import type { SupportNeedsAssessorSubmit } from "./support-needs-assessor";

/** An authored self-report, never an I-CAN, WHODAS, Vineland or NDIA assessment. */
export function buildParticipantSupportSnapshot(input: SupportNeedsAssessorSubmit) {
  const recordedAt = new Date().toISOString();
  return {
    schemaVersion: 1,
    recordType: "participant_authored_support_snapshot" as const,
    source: "mapable_registration",
    recordedAt,
    instrument: null,
    officialAssessment: false,
    selectedAreas: [...input.selectedAreas],
    areas: input.answers.map(({ domainId, intensity }) => ({
      domainId,
      participantDescription: intensity,
      evidenceStatus: "self_report" as const,
    })),
    unselectedAreasMean: "not_assessed" as const,
    priorityArea: input.priorityArea ?? null,
    participantGoal: input.participantGoal ?? null,
    communicationAccess: input.communicationAccess ?? null,
    changingSupportNeeds: input.changingSupportNeeds ?? null,
    anythingElse: input.anythingElse ?? null,
    consent: {
      purpose: "participant_planning_draft",
      consentDraftProcessing: true,
      acknowledgementNoClinicalPaste: true,
      recordedAt,
    },
  };
}

export type StoredSupportRecordKind =
  | "participant_self_report"
  | "legacy_registration"
  | "legacy_ican_draft"
  | "skipped"
  | "unknown";

/**
 * Interpret historical stored records without rewriting the original data.
 * A legacy or unknown payload never becomes a participant-authored statement.
 */
export function classifyStoredSupportNeedsRecord(payload: unknown): StoredSupportRecordKind {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return "unknown";
  }
  const item = payload as Record<string, unknown>;
  if (item.skipped === true) return "skipped";
  if (
    item.schemaVersion === 1 &&
    item.recordType === "participant_authored_support_snapshot" &&
    item.unselectedAreasMean === "not_assessed" &&
    Array.isArray(item.areas)
  ) {
    return "participant_self_report";
  }
  if (item.source === "registration_assessor" && item.domains && typeof item.domains === "object") {
    return "legacy_registration";
  }
  if (item.domains && typeof item.domains === "object") return "legacy_ican_draft";
  return "unknown";
}
