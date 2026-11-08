import { flagCreativeClaims } from "@/lib/ads/moderation/creative-review";
import { prisma } from "@/lib/prisma";

export const ADS_POLICY_VERSION = "ads-manager-policy-v1";

export class SelfApprovalError extends Error {
  readonly code = "REVIEWER_SELF_APPROVAL";
  constructor() {
    super("Reviewers cannot approve their own campaign creatives");
    this.name = "SelfApprovalError";
  }
}

export function evaluateCreativeForReview(input: {
  headline: string;
  body: string;
  altText?: string | null;
}): { claimFlags: string[]; requiresHumanReview: boolean } {
  const claimFlags = flagCreativeClaims(
    [input.headline, input.body, input.altText ?? ""].join(" "),
  );
  return {
    claimFlags,
    requiresHumanReview: claimFlags.length > 0,
  };
}

export async function recordCreativeReviewDecision(input: {
  creativeId: string;
  reviewerId: string;
  campaignCreatedByUserId: string | null | undefined;
  decision: "APPROVED" | "REJECTED" | "CHANGES_REQUESTED";
  reasonCodes: string[];
  notes?: string;
  evidenceRef?: string;
}) {
  if (
    input.campaignCreatedByUserId &&
    input.campaignCreatedByUserId === input.reviewerId
  ) {
    throw new SelfApprovalError();
  }

  const status =
    input.decision === "CHANGES_REQUESTED" ? "PENDING_REVIEW" : input.decision;

  return prisma.adPolicyReview.create({
    data: {
      creativeId: input.creativeId,
      reviewerId: input.reviewerId,
      status,
      reasonCodes: input.reasonCodes,
      policyVersion: ADS_POLICY_VERSION,
      notes: input.notes,
      evidenceRef: input.evidenceRef,
    },
  });
}
