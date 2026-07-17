import { prisma } from "@/lib/prisma";

export async function openAccessReview(params: {
  scope: string;
  reviewerId: string;
}) {
  return prisma.accessReview.create({
    data: {
      scope: params.scope,
      reviewerId: params.reviewerId,
      status: "open",
    },
  });
}

export async function completeAccessReview(reviewId: string) {
  return prisma.accessReview.update({
    where: { id: reviewId },
    data: { status: "completed", completedAt: new Date() },
  });
}

export async function listOpenAccessReviews() {
  return prisma.accessReview.findMany({
    where: { status: "open" },
    orderBy: { id: "asc" },
  });
}
