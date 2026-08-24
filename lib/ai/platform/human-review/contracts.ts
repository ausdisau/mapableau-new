export const HUMAN_REVIEW_STATES = [
  "suggestion_generated",
  "participant_correction_requested",
  "human_review_required",
  "approved",
  "rejected",
  "amended",
  "expired",
  "withdrawn",
  "superseded",
] as const;

export type HumanReviewState = (typeof HUMAN_REVIEW_STATES)[number];


/**
 * Canonical human-review category taxonomy (Prompt 08).
 * Shared by MapAbleHumanReviewItem.category and Human Operations queue.
 * Safeguarding remains human-only — see policies/safeguarding-gate.ts.
 */
export const HUMAN_REVIEW_CATEGORIES = [
  "care_coordination",
  "transport_continuity",
  "access_evidence",
  "authority_review",
  "financial_review",
  "credential_exception",
  "employment_disclosure_review",
  "safeguarding",
  "general_coordination",
] as const;

export type HumanReviewCategory = (typeof HUMAN_REVIEW_CATEGORIES)[number];


export type ProposalApprovalBinding = {
  proposalHash: string;
  actorId: string;
  actorAuthority: string;
  purpose: string;
  timestamp: string;
  expiresAt: string | null;
  dataDisclosed: string[];
  proposedAction: string;
  revision: number;
};

/** A model-generated proposal is never approved merely because it exists. */
export function isProposalApproved(state: HumanReviewState): boolean {
  return state === "approved";
}

export function assertApprovalBindingComplete(
  binding: ProposalApprovalBinding
): boolean {
  return Boolean(
    binding.proposalHash &&
      binding.actorId &&
      binding.actorAuthority &&
      binding.purpose &&
      binding.timestamp &&
      binding.proposedAction &&
      binding.revision >= 1
  );
}

/** Safeguarding category is never AI-decidable. */
export function isHumanOnlyReviewCategory(
  category: string,
): category is "safeguarding" {
  return category === "safeguarding";
}

