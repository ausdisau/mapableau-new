import { NdisGatewayError, assertNever } from "@/lib/ndis-gateway/domain/errors";

/**
 * Canonical claim lifecycle statuses.
 * Dual engine enums map into this set via compatibility layers (Wave 7 cutover).
 */
export const CANONICAL_CLAIM_STATUSES = [
  "draft",
  "validation_failed",
  "validated",
  "awaiting_approval",
  "approved",
  "preparing",
  "submission_pending",
  "submitted",
  "acknowledgement_received",
  "processing",
  "accepted",
  "partially_paid",
  "paid",
  "rejected",
  "on_hold",
  "needs_information",
  "submission_unknown",
  "correction_required",
  "corrected",
  "resubmission_pending",
  "voided",
  "closed",
] as const;

export type CanonicalClaimStatus = (typeof CANONICAL_CLAIM_STATUSES)[number];

const ALLOWED_TRANSITIONS: Record<CanonicalClaimStatus, readonly CanonicalClaimStatus[]> = {
  draft: ["validated", "validation_failed", "voided"],
  validation_failed: ["draft", "validated", "voided"],
  validated: ["awaiting_approval", "validation_failed", "draft", "voided"],
  awaiting_approval: ["approved", "validated", "voided", "rejected"],
  approved: ["preparing", "awaiting_approval", "voided"],
  preparing: ["submission_pending", "approved", "submission_unknown"],
  submission_pending: [
    "submitted",
    "submission_unknown",
    "rejected",
    "preparing",
  ],
  submitted: [
    "acknowledgement_received",
    "processing",
    "accepted",
    "rejected",
    "on_hold",
    "needs_information",
    "submission_unknown",
  ],
  acknowledgement_received: [
    "processing",
    "accepted",
    "rejected",
    "on_hold",
    "needs_information",
  ],
  processing: [
    "accepted",
    "partially_paid",
    "paid",
    "rejected",
    "on_hold",
    "needs_information",
    "correction_required",
  ],
  accepted: ["partially_paid", "paid", "correction_required", "closed"],
  partially_paid: ["paid", "correction_required", "closed"],
  paid: ["closed"],
  rejected: ["correction_required", "corrected", "voided", "closed"],
  on_hold: ["processing", "needs_information", "rejected", "accepted"],
  needs_information: [
    "processing",
    "correction_required",
    "rejected",
    "on_hold",
  ],
  submission_unknown: [
    "submitted",
    "acknowledgement_received",
    "processing",
    "rejected",
    "correction_required",
  ],
  correction_required: ["corrected", "voided", "closed"],
  corrected: ["resubmission_pending", "awaiting_approval", "voided"],
  resubmission_pending: [
    "preparing",
    "submission_pending",
    "submitted",
    "voided",
  ],
  voided: ["closed"],
  closed: [],
};

export function isCanonicalClaimStatus(
  value: string
): value is CanonicalClaimStatus {
  return (CANONICAL_CLAIM_STATUSES as readonly string[]).includes(value);
}

export function canTransitionClaimStatus(
  from: CanonicalClaimStatus,
  to: CanonicalClaimStatus
): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function assertCanTransition(
  from: CanonicalClaimStatus,
  to: CanonicalClaimStatus
): void {
  if (!canTransitionClaimStatus(from, to)) {
    throw new NdisGatewayError({
      code: "INVALID_STATUS_TRANSITION",
      plainLanguageMessage:
        "This claim cannot move to that status from its current status.",
      technicalMessage: `Invalid claim status transition: ${from} → ${to}`,
    });
  }
}

/** Exhaustive helper for switch statements over canonical statuses. */
export function exhaustClaimStatus(status: CanonicalClaimStatus): never {
  return assertNever(status, "Unhandled canonical claim status");
}
