/**
 * Ads Manager campaign lifecycle transitions — server-owned states only.
 */

export const MANAGER_LIFECYCLE_STATUSES = [
  "DRAFT",
  "VALIDATING",
  "AWAITING_REVIEW",
  "CHANGES_REQUESTED",
  "REJECTED",
  "APPROVED",
  "QUOTE_PENDING",
  "AWAITING_SPEND_AUTHORISATION",
  "AUTHORISING",
  "READY_TO_SUBMIT",
  "SUBMITTING",
  "SCHEDULED",
  "PARTIALLY_SCHEDULED",
  "SUBMISSION_UNKNOWN",
  "FAILED",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "CANCELLED",
  "RECONCILED",
  "CLOSED",
] as const;

export type ManagerLifecycleStatus =
  (typeof MANAGER_LIFECYCLE_STATUSES)[number];

const ALLOWED: Record<ManagerLifecycleStatus, ManagerLifecycleStatus[]> = {
  DRAFT: ["VALIDATING", "AWAITING_REVIEW", "CANCELLED"],
  VALIDATING: ["AWAITING_REVIEW", "CHANGES_REQUESTED", "DRAFT", "FAILED"],
  AWAITING_REVIEW: ["APPROVED", "CHANGES_REQUESTED", "REJECTED"],
  CHANGES_REQUESTED: ["DRAFT", "VALIDATING", "CANCELLED"],
  REJECTED: ["CLOSED"],
  APPROVED: ["QUOTE_PENDING", "AWAITING_SPEND_AUTHORISATION", "CANCELLED"],
  QUOTE_PENDING: ["AWAITING_SPEND_AUTHORISATION", "CHANGES_REQUESTED", "CANCELLED"],
  AWAITING_SPEND_AUTHORISATION: ["AUTHORISING", "CANCELLED"],
  AUTHORISING: ["READY_TO_SUBMIT", "FAILED", "CANCELLED"],
  READY_TO_SUBMIT: ["SUBMITTING", "CANCELLED"],
  SUBMITTING: [
    "SCHEDULED",
    "PARTIALLY_SCHEDULED",
    "SUBMISSION_UNKNOWN",
    "FAILED",
    "ACTIVE",
  ],
  SCHEDULED: ["ACTIVE", "PAUSED", "CANCELLED", "FAILED"],
  PARTIALLY_SCHEDULED: ["ACTIVE", "PAUSED", "CANCELLED", "FAILED", "RECONCILED"],
  SUBMISSION_UNKNOWN: ["SCHEDULED", "FAILED", "CANCELLED", "RECONCILED"],
  FAILED: ["DRAFT", "CLOSED", "RECONCILED"],
  ACTIVE: ["PAUSED", "COMPLETED", "CANCELLED", "RECONCILED"],
  PAUSED: ["ACTIVE", "CANCELLED", "COMPLETED", "RECONCILED"],
  COMPLETED: ["RECONCILED", "CLOSED"],
  CANCELLED: ["RECONCILED", "CLOSED"],
  RECONCILED: ["CLOSED"],
  CLOSED: [],
};

export class ForbiddenLifecycleTransitionError extends Error {
  readonly code = "FORBIDDEN_LIFECYCLE_TRANSITION";
  constructor(
    readonly from: ManagerLifecycleStatus,
    readonly to: ManagerLifecycleStatus,
  ) {
    super(`Cannot transition campaign from ${from} to ${to}`);
    this.name = "ForbiddenLifecycleTransitionError";
  }
}

export function assertLifecycleTransition(
  from: ManagerLifecycleStatus,
  to: ManagerLifecycleStatus,
): void {
  if (from === to) return;
  const allowed = ALLOWED[from] ?? [];
  if (!allowed.includes(to)) {
    throw new ForbiddenLifecycleTransitionError(from, to);
  }
}

export function canClientMutateDraft(status: ManagerLifecycleStatus): boolean {
  return status === "DRAFT" || status === "CHANGES_REQUESTED";
}
