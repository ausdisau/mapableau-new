export interface ParticipantNotificationDraft {
  opaqueJourneyId: string;
  message: string;
  requiresApproval: boolean;
}

export function draftParticipantJourneyNotification(
  opaqueJourneyId: string,
  message: string,
  materialChange: boolean,
): ParticipantNotificationDraft {
  return { opaqueJourneyId, message, requiresApproval: materialChange };
}
