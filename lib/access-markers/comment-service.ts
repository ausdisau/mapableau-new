import { recomputeMarkerAggregate } from "@/lib/access-markers/aggregate-service";
import { scanMarkerCommentForModeration } from "@/lib/access-markers/moderation";
import type { AccessMarkerCommentType } from "@/lib/access-markers/types";
import { prisma } from "@/lib/prisma";

const COMMENT_RATE_LIMIT_PER_HOUR = 15;

export async function createMarkerComment(params: {
  placeId: string;
  userId: string;
  commentType: AccessMarkerCommentType;
  body: string;
  ratingId?: string;
  evidencePhotoIds?: string[];
}) {
  const recent = await prisma.accessMarkerComment.count({
    where: {
      userId: params.userId,
      createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
    },
  });
  if (recent >= COMMENT_RATE_LIMIT_PER_HOUR) {
    throw new Error("MARKER_COMMENT_RATE_LIMIT");
  }

  const place = await prisma.accessPlace.findUnique({
    where: { id: params.placeId },
    select: { id: true },
  });
  if (!place) throw new Error("PLACE_NOT_FOUND");

  const scan = scanMarkerCommentForModeration(params.body);
  const status = scan.needsReview ? "needs_review" : "published";

  const comment = await prisma.accessMarkerComment.create({
    data: {
      placeId: params.placeId,
      userId: params.userId,
      ratingId: params.ratingId,
      commentType: params.commentType,
      body: params.body.trim(),
      evidencePhotoIds: params.evidencePhotoIds ?? [],
      status,
      moderationFlags: scan.flags,
    },
  });

  if (scan.needsReview) {
    await prisma.accessModerationQueue.create({
      data: {
        entityType: "AccessMarkerComment",
        entityId: comment.id,
        flagReason: scan.reasons.join("; "),
        priority: scan.flags.abusiveLanguage || scan.flags.privacyRisk ? 2 : 1,
      },
    });
  }

  await recomputeMarkerAggregate(params.placeId);
  return { comment, needsReview: scan.needsReview, reasons: scan.reasons };
}
