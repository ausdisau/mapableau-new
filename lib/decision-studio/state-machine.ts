import type { DecisionState } from "./types";

const TRANSITIONS: Record<DecisionState, DecisionState[]> = {
  draft: ["information_gathering", "withdrawn"],
  information_gathering: [
    "participant_review",
    "questions_pending",
    "withdrawn",
  ],
  participant_review: [
    "supporter_review_optional",
    "questions_pending",
    "ready_for_decision",
    "withdrawn",
  ],
  supporter_review_optional: [
    "questions_pending",
    "ready_for_decision",
    "participant_review",
    "withdrawn",
  ],
  questions_pending: [
    "information_gathering",
    "participant_review",
    "ready_for_decision",
    "withdrawn",
  ],
  ready_for_decision: [
    "participant_selected",
    "withdrawn",
    "expired",
  ],
  participant_selected: [
    "confirmation_required",
    "confirmed",
    "withdrawn",
  ],
  confirmation_required: ["confirmed", "participant_selected", "withdrawn"],
  confirmed: ["reversed", "disputed"],
  reversed: ["participant_review", "disputed"],
  expired: [],
  withdrawn: [],
  disputed: ["participant_review", "withdrawn"],
};

export function canTransitionDecisionState(
  from: DecisionState,
  to: DecisionState
): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertDecisionTransition(
  from: DecisionState,
  to: DecisionState
): void {
  if (!canTransitionDecisionState(from, to)) {
    throw new Error(`Invalid decision transition: ${from} → ${to}`);
  }
}
