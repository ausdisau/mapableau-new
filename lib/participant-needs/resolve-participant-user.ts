import { isMockParticipant, MOCK_PARTICIPANT_ID } from "@/lib/prms/mockPrmsData";

/** PRMS demo id vs authenticated user id (CareRequest.participantId is User.id). */
export function resolveParticipantUserId(participantId: string): string | null {
  if (isMockParticipant(participantId)) {
    return null;
  }
  return participantId;
}

export function isDemoParticipantId(participantId: string): boolean {
  return participantId === MOCK_PARTICIPANT_ID || isMockParticipant(participantId);
}
