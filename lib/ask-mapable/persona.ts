/**
 * Ask MapAble persona + safe failure copy.
 * The language model is not the system of record.
 */

export const ASK_MAPABLE_NAME = "Ask MapAble";

export const ASK_MAPABLE_SUBTITLE =
  "Accessible information, planning and support across MapAble.";

export const ASK_MAPABLE_AI_DISCLOSURE =
  "Ask MapAble is AI-assisted. It explains MapAble information and prepares drafts — it does not approve NDIS claims, decide eligibility, or change your preferences without confirmation.";

export const ASK_MAPABLE_SAFE_FAILURE =
  "Ask MapAble couldn't complete that response. You can try again, use the standard MapAble controls, or ask to speak with a person.";

export const ASK_MAPABLE_PENDING = "Ask MapAble is checking…";

export const ASK_MAPABLE_HUMAN_HELP_PATTERNS =
  /\b(talk to (a )?(person|human|someone|staff|support)|speak (to|with) (a )?(person|human|someone|staff)|real person|human (help|support)|contact (mapable )?support|escalate)\b/i;

export function isHumanHelpRequest(query: string): boolean {
  return ASK_MAPABLE_HUMAN_HELP_PATTERNS.test(query.trim());
}

/** Diagnosis should not be requested when functional needs suffice. */
export function unnecessarilyRequestsDiagnosis(answer: string): boolean {
  return /\b(what is your diagnosis|tell me your diagnosis|your condition is|disclose your disability diagnosis)\b/i.test(
    answer,
  );
}

export function buildAskPersonaAnswerEnvelope(input: {
  answer: string;
  constraintsNote?: string | null;
  evidenceNotes?: string[];
  specialistReason?: string;
}): string {
  const parts = [input.answer.trim()];
  if (input.constraintsNote) {
    parts.push(input.constraintsNote);
  }
  if (input.evidenceNotes?.length) {
    parts.push(`Evidence: ${input.evidenceNotes.join(" ")}`);
  }
  return parts.filter(Boolean).join("\n\n");
}
