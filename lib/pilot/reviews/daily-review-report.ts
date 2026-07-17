import type { PilotDailyReview } from "@prisma/client";

export function formatDailyReviewReport(review: PilotDailyReview): string {
  return [
    `Pilot daily review ${review.id}`,
    `Date: ${review.reviewDate.toISOString().slice(0, 10)}`,
    `Outcome: ${review.outcome}`,
    review.notes ? `Notes: ${review.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}
