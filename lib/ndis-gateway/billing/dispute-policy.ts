import type {
  NdisBillingDisputeCategory,
  NdisBillingDisputeStatus,
} from "@prisma/client";

export type DisputeTransitionIssue = {
  code: string;
  message: string;
};

const ALLOWED_DISPUTE_TRANSITIONS: Record<
  NdisBillingDisputeStatus,
  readonly NdisBillingDisputeStatus[]
> = {
  open: ["under_review", "payment_held", "withdrawn", "escalated"],
  under_review: ["payment_held", "resolved", "escalated", "withdrawn"],
  payment_held: ["under_review", "resolved", "escalated"],
  resolved: [],
  withdrawn: [],
  escalated: ["under_review", "resolved", "payment_held"],
};

export function canTransitionDisputeStatus(
  from: NdisBillingDisputeStatus,
  to: NdisBillingDisputeStatus
): boolean {
  if (from === to) return true;
  return ALLOWED_DISPUTE_TRANSITIONS[from].includes(to);
}

export function assertDisputeTransition(
  from: NdisBillingDisputeStatus,
  to: NdisBillingDisputeStatus
): void {
  if (!canTransitionDisputeStatus(from, to)) {
    throw new Error(`DISPUTE_TRANSITION_FORBIDDEN:${from}->${to}`);
  }
}

/** Opening a dispute always places payment on hold by default. */
export function disputeOpensWithPaymentHold(
  _category: NdisBillingDisputeCategory
): boolean {
  return true;
}

export function isTerminalDisputeStatus(
  status: NdisBillingDisputeStatus
): boolean {
  return status === "resolved" || status === "withdrawn";
}
