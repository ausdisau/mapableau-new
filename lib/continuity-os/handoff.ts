import type { HandoffState } from "@/lib/continuity-os/types";

export interface ContinuityHandoffRecord {
  id: string;
  missionId: string;
  recoveryCaseId?: string;
  sendingOrganisation: string;
  receivingOrganisation: string;
  responsiblePeople: string[];
  purpose: string;
  tasks: string[];
  participantApprovedFields: string[];
  informationOmitted: string[];
  deadline?: string;
  state: HandoffState;
  unresolvedItems: string[];
  fallback?: string;
  serviceCommitment?: string;
}

export type HandoffReceiptKind =
  | "sent"
  | "delivered"
  | "opened"
  | "accepted"
  | "task_acknowledged"
  | "task_completed"
  | "externally_verified"
  | "participant_confirmed";

const HANDOFF_TRANSITIONS: Record<HandoffState, HandoffState[]> = {
  draft: ["prepared", "withdrawn", "human_review_required"],
  prepared: ["participant_review", "withdrawn", "human_review_required"],
  participant_review: ["sent", "withdrawn", "draft", "human_review_required"],
  sent: ["received", "expired", "failed", "human_review_required"],
  received: [
    "accepted",
    "partially_accepted",
    "rejected",
    "expired",
    "human_review_required",
  ],
  accepted: ["completed", "failed", "human_review_required"],
  partially_accepted: ["completed", "failed", "human_review_required"],
  rejected: ["draft", "human_review_required"],
  expired: ["draft", "human_review_required"],
  withdrawn: [],
  completed: [],
  failed: ["draft", "human_review_required"],
  human_review_required: ["draft", "prepared", "withdrawn"],
};

export function canTransitionHandoff(
  from: HandoffState,
  to: HandoffState
): boolean {
  return HANDOFF_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Sent is not accepted; accepted is not proof every task completed. */
export function handoffCompletionClaim(state: HandoffState): {
  sent: boolean;
  accepted: boolean;
  tasksCompleted: boolean;
} {
  const order: HandoffState[] = [
    "sent",
    "received",
    "accepted",
    "partially_accepted",
    "completed",
  ];
  const idx = order.indexOf(state);
  return {
    sent: idx >= 0 || state === "failed" || state === "expired",
    accepted: state === "accepted" || state === "completed",
    tasksCompleted: state === "completed",
  };
}

export function assertHandoffTransition(
  from: HandoffState,
  to: HandoffState
): void {
  if (!canTransitionHandoff(from, to)) {
    throw new Error(`Invalid handoff transition ${from} -> ${to}`);
  }
}
