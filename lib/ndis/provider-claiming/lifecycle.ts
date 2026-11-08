/**
 * Application-level NDIA claim lifecycle.
 * Separates internal draft / synthetic validation from government acknowledgement.
 * Prisma `NdiaProviderClaimStatus` remains the persistence enum; this layer
 * interprets and constrains transitions without requiring a migration in Wave-1.
 */

import type { NdiaProviderClaimStatus } from "@prisma/client";

export const NDIA_CLAIM_LIFECYCLE_PHASES = [
  "internal_draft",
  "synthetic_validated",
  "pending_human_approval",
  "government_submission_blocked",
  "submitted_pending_ack",
  "acknowledged",
  "rejected",
  "reconciliation_pending",
  "reconciled",
  "failed",
] as const;

export type NdiaClaimLifecyclePhase = (typeof NDIA_CLAIM_LIFECYCLE_PHASES)[number];

/** Markers stored in `externalStatus` for synthetic-only outcomes. */
export const SYNTHETIC_EXTERNAL_STATUS = {
  validationOnly: "synthetic_validation_only",
  mockLegacy: "submitted_mock",
} as const;

export const GOVERNMENT_ACK_EXTERNAL_STATUSES = [
  "acknowledged",
  "accepted",
  "rejected",
  "paid",
] as const;

export function mapPrismaStatusToLifecycle(
  status: NdiaProviderClaimStatus,
  externalStatus?: string | null,
): NdiaClaimLifecyclePhase {
  if (
    externalStatus === SYNTHETIC_EXTERNAL_STATUS.validationOnly ||
    externalStatus === SYNTHETIC_EXTERNAL_STATUS.mockLegacy
  ) {
    if (status === "submitted" || status === "dry_run_passed" || status === "validated") {
      return "synthetic_validated";
    }
  }

  switch (status) {
    case "draft":
      return "internal_draft";
    case "validated":
      return "synthetic_validated";
    case "dry_run_passed":
      return "government_submission_blocked";
    case "submitted":
      return "submitted_pending_ack";
    case "accepted":
      return "acknowledged";
    case "rejected":
      return "rejected";
    case "paid":
      return "reconciled";
    case "failed":
      return "failed";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

/**
 * Persistence status after a synthetic (non-government) validation outcome.
 * Never returns `submitted` — that requires NDIA acknowledgement evidence.
 */
export function prismaStatusForSyntheticValidation(): Extract<
  NdiaProviderClaimStatus,
  "dry_run_passed"
> {
  return "dry_run_passed";
}

export function isGovernmentAcknowledgedPhase(
  phase: NdiaClaimLifecyclePhase,
): boolean {
  return (
    phase === "acknowledged" ||
    phase === "rejected" ||
    phase === "reconciliation_pending" ||
    phase === "reconciled"
  );
}

export function assertTransitionAllowed(
  from: NdiaClaimLifecyclePhase,
  to: NdiaClaimLifecyclePhase,
): void {
  const allowed: Record<NdiaClaimLifecyclePhase, NdiaClaimLifecyclePhase[]> = {
    internal_draft: ["synthetic_validated", "failed"],
    synthetic_validated: [
      "pending_human_approval",
      "government_submission_blocked",
      "internal_draft",
      "failed",
    ],
    pending_human_approval: [
      "government_submission_blocked",
      "synthetic_validated",
      "failed",
    ],
    government_submission_blocked: [
      "submitted_pending_ack",
      "synthetic_validated",
      "failed",
    ],
    submitted_pending_ack: [
      "acknowledged",
      "rejected",
      "reconciliation_pending",
      "failed",
    ],
    acknowledged: ["reconciliation_pending", "reconciled"],
    rejected: ["internal_draft", "failed"],
    reconciliation_pending: ["reconciled", "failed"],
    reconciled: [],
    failed: ["internal_draft"],
  };

  if (!allowed[from].includes(to)) {
    throw new Error(`NDIA_LIFECYCLE_TRANSITION_FORBIDDEN:${from}->${to}`);
  }
}

/** Government submission phases are unreachable until authorised transport exists. */
export function isLiveSubmissionPhaseReachable(): false {
  return false;
}
