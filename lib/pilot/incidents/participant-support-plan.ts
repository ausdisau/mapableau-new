export type ParticipantSupportPlan = {
  participantId: string;
  immediateActions: string[];
  communicationPlan: string;
  reviewBy: string | null;
};

export function buildParticipantSupportPlan(input: {
  participantId: string;
  incidentSeverity: string;
  safeguardingConcern: boolean;
}): ParticipantSupportPlan {
  const immediateActions = ["Acknowledge incident with participant"];
  if (input.safeguardingConcern) {
    immediateActions.push("Escalate to safeguarding owner");
  }
  if (input.incidentSeverity === "critical" || input.incidentSeverity === "high") {
    immediateActions.push("Offer wellbeing check within 24h");
  }
  return {
    participantId: input.participantId,
    immediateActions,
    communicationPlan:
      "Use preferred contact method; no automated regulatory notification.",
    reviewBy: null,
  };
}
