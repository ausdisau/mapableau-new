/**
 * MapAble Companion persona + safe failure copy.
 *
 * Compatibility note: existing ASK_MAPABLE_* export names remain stable so
 * routes, evaluations and integrations do not need to fork. The participant-
 * facing identity is MapAble Companion.
 *
 * The language model is not the system of record.
 */

export const ASK_MAPABLE_NAME = "MapAble Companion";

export const ASK_MAPABLE_SUBTITLE =
  "Your accessible assistant for planning, support and action across MapAble.";

export const ASK_MAPABLE_AI_DISCLOSURE =
  "MapAble Companion is AI-assisted. You stay in control. It can explain MapAble information, help plan and prepare actions, but consequential changes still require confirmation.";

export const ASK_MAPABLE_SAFE_FAILURE =
  "MapAble Companion couldn't complete that response. You can try again, use the standard MapAble controls, or ask to speak with a person.";

export const ASK_MAPABLE_PENDING = "MapAble Companion is checking…";

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
