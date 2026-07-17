export function buildRegulatorEvidencePack(input: {
  pilotId: string;
  assuranceAssessmentId: string | null;
  goLiveAssessmentId: string | null;
  decisionIds: string[];
  incidentIds: string[];
}): Record<string, unknown> {
  return {
    pilotId: input.pilotId,
    assuranceAssessmentId: input.assuranceAssessmentId,
    goLiveAssessmentId: input.goLiveAssessmentId,
    decisionIds: input.decisionIds,
    incidentIds: input.incidentIds,
    note: "Human-assembled evidence pack — no automatic regulator notification.",
  };
}
