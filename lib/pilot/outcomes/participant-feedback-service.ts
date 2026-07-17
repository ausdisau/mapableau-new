export type PilotFeedback = {
  participantId: string;
  score: number;
  comment?: string;
  submittedAt: string;
};

export function validatePilotFeedback(input: {
  score: number;
  comment?: string;
}): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!Number.isInteger(input.score) || input.score < 0 || input.score > 10) {
    errors.push("SCORE_OUT_OF_RANGE");
  }
  return { ok: errors.length === 0, errors };
}
