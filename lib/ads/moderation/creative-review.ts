/**
 * Claim keywords that require human creative review — never auto-approve.
 */
export const CREATIVE_CLAIM_FLAGS = [
  "accessibility",
  "accessible",
  "ndis",
  "healthcare",
  "clinical",
  "employment outcomes",
  "accreditation",
  "accredited",
  "safety",
  "government approved",
  "guaranteed",
  "best",
  "recommended",
  "fully accessible",
  "wheelchair friendly",
] as const;

export function flagCreativeClaims(text: string): string[] {
  const lower = text.toLowerCase();
  return CREATIVE_CLAIM_FLAGS.filter((term) => lower.includes(term));
}

export type CreativeReviewStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "ACTIVE"
  | "REJECTED"
  | "PAUSED";

export function canActivateCreative(
  status: CreativeReviewStatus,
): boolean {
  return status === "APPROVED" || status === "ACTIVE";
}

export const CAMPAIGN_STATUS_FLOW = [
  "DRAFT",
  "PENDING_REVIEW",
  "APPROVED",
  "ACTIVE",
  "PAUSED",
  "ENDED",
  "REJECTED",
] as const;
