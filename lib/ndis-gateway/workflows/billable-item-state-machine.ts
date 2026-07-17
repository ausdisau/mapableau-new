import type { NdisBillableItemStatus } from "@prisma/client";

import { NdisGatewayError } from "@/lib/ndis-gateway/domain/errors";

/**
 * Allowed transitions for billable items.
 * Forbidden examples are listed in FORBIDDEN_BILLABLE_TRANSITIONS.
 */
const ALLOWED: Record<NdisBillableItemStatus, readonly NdisBillableItemStatus[]> = {
  draft: [
    "evidence_pending",
    "funding_route_pending",
    "pricing_pending",
    "validation_failed",
    "ready",
    "voided",
  ],
  evidence_pending: [
    "participant_confirmation_pending",
    "draft",
    "validation_failed",
    "ready",
    "voided",
  ],
  participant_confirmation_pending: [
    "evidence_pending",
    "ready",
    "validation_failed",
    "disputed",
    "voided",
  ],
  funding_route_pending: ["draft", "ready", "validation_failed", "voided"],
  pricing_pending: ["draft", "ready", "validation_failed", "voided"],
  validation_failed: ["draft", "voided"],
  ready: [
    "locked",
    "invoiced",
    "claim_packaged",
    "disputed",
    "voided",
    "correction_required",
  ],
  locked: [
    "invoiced",
    "claim_packaged",
    "dispatched",
    "voided",
    "correction_required",
  ],
  invoiced: [
    "dispatched",
    "partially_paid",
    "paid",
    "disputed",
    "voided",
    "correction_required",
  ],
  claim_packaged: ["dispatched", "disputed", "voided", "correction_required"],
  dispatched: [
    "partially_paid",
    "paid",
    "rejected",
    "disputed",
    "correction_required",
  ],
  partially_paid: ["paid", "disputed", "correction_required"],
  paid: ["reversed", "archived"],
  rejected: ["correction_required", "corrected", "voided"],
  disputed: ["correction_required", "voided", "ready", "locked"],
  correction_required: ["corrected", "voided", "draft"],
  corrected: ["archived", "voided"],
  reversed: ["archived", "voided"],
  voided: ["archived"],
  archived: [],
  migrated_review_required: ["draft", "validation_failed", "voided", "ready"],
};

export function canTransitionBillableItemStatus(
  from: NdisBillableItemStatus,
  to: NdisBillableItemStatus
): boolean {
  if (from === to) return true;
  return ALLOWED[from].includes(to);
}

export function assertBillableItemTransition(
  from: NdisBillableItemStatus,
  to: NdisBillableItemStatus
): void {
  if (!canTransitionBillableItemStatus(from, to)) {
    throw new NdisGatewayError({
      code: "INVALID_STATUS_TRANSITION",
      plainLanguageMessage:
        "This billable item cannot move to that status from its current status.",
      technicalMessage: `Invalid billable item transition: ${from} → ${to}`,
    });
  }
}

/** Documented forbidden jumps (for tests / docs). */
export const FORBIDDEN_BILLABLE_TRANSITIONS: ReadonlyArray<
  readonly [NdisBillableItemStatus, NdisBillableItemStatus]
> = [
  ["draft", "paid"],
  ["draft", "dispatched"],
  ["voided", "ready"],
  ["paid", "draft"],
  ["archived", "ready"],
];
