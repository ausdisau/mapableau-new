export type AccessibilitySupportRequest = {
  pilotId: string;
  participantId: string;
  need: string;
  status: "open" | "in_progress" | "resolved";
};

export function createAccessibilitySupportRequest(input: {
  pilotId: string;
  participantId: string;
  need: string;
}): AccessibilitySupportRequest {
  return {
    pilotId: input.pilotId,
    participantId: input.participantId,
    need: input.need,
    status: "open",
  };
}
