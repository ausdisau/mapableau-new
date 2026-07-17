import { originalDecisionMakerCannotDecideAppeal } from "@/lib/public-interest-governance/appeals/appeal-state-machine";
import { prisma } from "@/lib/prisma";

export function isReviewerIndependent(
  decisionOwnerId: string,
  reviewerId: string,
): boolean {
  return originalDecisionMakerCannotDecideAppeal(decisionOwnerId, reviewerId);
}

export async function assignIndependentReviewer(params: {
  appealId: string;
  reviewerUserId: string;
  conflictChecked: boolean;
  conflictFound?: boolean;
}) {
  if (!params.conflictChecked) throw new Error("CONFLICT_CHECK_REQUIRED");

  const appeal = await prisma.appealCase.findUnique({
    where: { id: params.appealId },
    include: { decision: true },
  });
  if (!appeal) throw new Error("APPEAL_NOT_FOUND");
  if (
    !isReviewerIndependent(
      appeal.decision.decisionOwnerId,
      params.reviewerUserId,
    )
  ) {
    throw new Error("REVIEWER_NOT_INDEPENDENT");
  }
  if (params.conflictFound) throw new Error("REVIEWER_CONFLICT_FOUND");

  const review = await prisma.independentReview.create({
    data: {
      appealId: params.appealId,
      reviewerUserId: params.reviewerUserId,
      conflictChecked: params.conflictChecked,
      conflictFound: false,
      assignedAt: new Date(),
    },
  });

  await prisma.appealCase.update({
    where: { id: params.appealId },
    data: { status: "reviewer_assigned" },
  });

  return review;
}

export async function completeIndependentReview(params: {
  reviewId: string;
  finding: string;
  outcome: "uphold" | "overturn" | "vary" | "remit";
  rationale: string;
}) {
  return prisma.independentReview.update({
    where: { id: params.reviewId },
    data: {
      completedAt: new Date(),
      findings: {
        create: {
          finding: params.finding,
          outcome: params.outcome,
          rationale: params.rationale,
        },
      },
    },
    include: { findings: true },
  });
}
