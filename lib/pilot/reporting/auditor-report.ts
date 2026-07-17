export function buildAuditorPilotReport(input: {
  pilotId: string;
  decisionCount: number;
  reservationCount: number;
  incidentCount: number;
  complaintCount: number;
}): Record<string, unknown> {
  return {
    pilotId: input.pilotId,
    decisionCount: input.decisionCount,
    reservationCount: input.reservationCount,
    incidentCount: input.incidentCount,
    complaintCount: input.complaintCount,
    controls: [
      "empty_allowlist_deny",
      "limited_live_default_off",
      "no_ai_auto_approval",
      "no_ndia_auto_submit",
      "integer_cents_only",
    ],
  };
}
