import type { AppealStatus } from "@prisma/client";

const APPEAL_TRANSITIONS: Record<AppealStatus, AppealStatus[]> = {
  draft: ["submitted", "withdrawn"],
  submitted: ["acknowledged", "withdrawn"],
  acknowledged: [
    "triage",
    "information_requested",
    "reviewer_assigned",
    "withdrawn",
  ],
  triage: [
    "information_requested",
    "reviewer_assigned",
    "escalated",
    "withdrawn",
  ],
  information_requested: ["participant_response", "withdrawn", "closed"],
  participant_response: ["triage", "reviewer_assigned", "withdrawn"],
  reviewer_assigned: ["under_review", "escalated", "withdrawn"],
  under_review: [
    "decision_pending",
    "information_requested",
    "escalated",
    "withdrawn",
  ],
  decision_pending: ["resolved", "escalated"],
  resolved: ["closed"],
  withdrawn: ["closed"],
  escalated: ["closed"],
  closed: [],
};

export function canTransitionAppeal(
  from: AppealStatus,
  to: AppealStatus,
): boolean {
  return APPEAL_TRANSITIONS[from].includes(to);
}

export function originalDecisionMakerCannotDecideAppeal(
  decisionOwnerId: string,
  reviewerId: string,
): boolean {
  return decisionOwnerId !== reviewerId;
}
