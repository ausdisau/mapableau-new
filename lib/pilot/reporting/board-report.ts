export function buildBoardPilotReport(input: {
  pilotName: string;
  status: string;
  stage: string;
  enrolled: number;
  committedCents: number;
  openSignals: number;
  reviewOutcome: string | null;
}): Record<string, unknown> {
  return {
    title: `Board pilot report — ${input.pilotName}`,
    status: input.status,
    stage: input.stage,
    enrolled: input.enrolled,
    committedCents: input.committedCents,
    openSignals: input.openSignals,
    latestReviewOutcome: input.reviewOutcome,
    disclaimer:
      "NdiaPilotApprovalRecord is not authority for this pilot or any claim.",
  };
}
