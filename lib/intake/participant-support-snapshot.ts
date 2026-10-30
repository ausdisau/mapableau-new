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
