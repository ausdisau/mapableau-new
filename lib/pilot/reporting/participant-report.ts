export function buildParticipantPilotReport(input: {
  pilotName: string;
  enrolmentStatus: string;
  hasPilotConsent: boolean;
}): Record<string, unknown> {
  return {
    title: `Your participation — ${input.pilotName}`,
    enrolmentStatus: input.enrolmentStatus,
    hasPilotConsent: input.hasPilotConsent,
    rights: [
      "Withdraw pilot consent at any time",
      "Raise a complaint without retaliation",
      "Request accessibility support",
    ],
  };
}
