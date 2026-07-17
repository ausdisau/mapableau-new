/**
 * Universal Handoff contract shared across all nine Connected Capability systems.
 * Sent ≠ accepted; accepted ≠ completed; completed ≠ participant outcome.
 */

export const HANDOFF_STATES = [
  "draft",
  "participant_review",
  "sent",
  "received",
  "accepted",
  "partially_accepted",
  "rejected",
  "expired",
  "completed",
  "failed",
] as const;

export type HandoffState = (typeof HANDOFF_STATES)[number];

export interface UniversalHandoff {
  id: string;
  state: HandoffState;
  sender: { type: string; id: string; label?: string };
  recipient: { type: string; id: string; label?: string };
  purpose: string;
  participantId: string;
  participantApprovedInformation: Record<string, unknown>;
  omittedFields: string[];
  task: string;
  deadline?: string | null;
  responsibility: string;
  accessibilityRequirements: string[];
  communicationMethod?: string | null;
  acceptance?: {
    acceptedAt?: string;
    acceptedBy?: string;
    notes?: string;
  } | null;
  unresolvedItems: string[];
  fallback?: string | null;
  receipt?: {
    receivedAt?: string;
    channel?: string;
  } | null;
  sourceVersion: string;
  isSynthetic?: boolean;
  createdAt: string;
  updatedAt: string;
}

export function handoffImpliesOutcome(_state: HandoffState): boolean {
  // Completed handoffs never prove participant outcome achievement.
  return false;
}

export function canTransitionHandoff(
  from: HandoffState,
  to: HandoffState
): boolean {
  const allowed: Record<HandoffState, HandoffState[]> = {
    draft: ["participant_review", "sent", "expired", "failed"],
    participant_review: ["draft", "sent", "rejected", "expired"],
    sent: ["received", "expired", "failed"],
    received: ["accepted", "partially_accepted", "rejected", "expired"],
    accepted: ["completed", "failed", "expired"],
    partially_accepted: ["completed", "failed", "expired", "accepted"],
    rejected: ["draft", "expired"],
    expired: [],
    completed: [],
    failed: ["draft"],
  };
  return allowed[from].includes(to);
}
