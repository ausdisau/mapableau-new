import type {
  AccessCommentType,
  AccessFeatureAnchor,
} from "@prisma/client";

import { scanReviewForModerationFlags } from "@/lib/access-moderation/content-safety-rules";
import { emitAccessNotification } from "@/lib/access-reviews/access-review-events";
import { recordIssueHistory } from "@/lib/access-reviews/issue-timeline-service";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function createAccessComment(params: {
  placeId: string;
  authorUserId: string;
  body: string;
  commentType: AccessCommentType;
  featureKey?: AccessFeatureAnchor;
  reviewId?: string;
  parentCommentId?: string;
  authorRole?: string;
}) {
  const flags = scanReviewForModerationFlags(params.body);
  const status = flags.length ? "pending" : "published";

  const comment = await prisma.accessPlaceComment.create({
    data: {
      placeId: params.placeId,
      authorUserId: params.authorUserId,
      body: params.body,
      commentType: params.commentType,
      featureKey: params.featureKey ?? "whole_place",
      reviewId: params.reviewId,
      parentCommentId: params.parentCommentId,
      authorRole: params.authorRole,
      status,
      moderationStatus: flags.length ? "pending" : "approved",
    },
  });

  if (flags.length) {
    await prisma.accessModerationQueue.create({
      data: {
        entityType: "AccessPlaceComment",
        entityId: comment.id,
        flagReason: flags.join("; "),
      },
    });
  }

  await createAuditEvent({
    actorUserId: params.authorUserId,
    action: "accessibility.comment.created",
    entityType: "AccessPlaceComment",
    entityId: comment.id,
  });

  if (params.commentType === "venue_response") {
    await recordIssueHistory({
      placeId: params.placeId,
      reviewId: params.reviewId,
      commentId: comment.id,
      state: "venue_responded",
      actorId: params.authorUserId,
    });
    await emitAccessNotification({
      userId: params.authorUserId,
      event: "accessibility.issue.venue_responded",
      title: "Venue response recorded",
      body: "Your venue response was submitted.",
    });
  } else if (params.parentCommentId) {
    const parent = await prisma.accessPlaceComment.findUnique({
      where: { id: params.parentCommentId },
    });
    if (parent && parent.authorUserId !== params.authorUserId) {
      await emitAccessNotification({
        userId: parent.authorUserId,
        event: "accessibility.comment.replied",
        title: "New reply",
        body: "Someone replied to your accessibility comment.",
      });
    }
  }

  return comment;
}

export async function listPlaceComments(params: {
  placeId: string;
  cursor?: string;
  take?: number;
}) {
  const take = params.take ?? 20;
  const rows = await prisma.accessPlaceComment.findMany({
    where: {
      placeId: params.placeId,
      status: "published",
      parentCommentId: null,
      ...(params.cursor ? { id: { lt: params.cursor } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: take + 1,
    include: {
      author: { select: { name: true } },
      replies: {
        where: { status: "published" },
        orderBy: { createdAt: "asc" },
        take: 10,
        include: { author: { select: { name: true } } },
      },
      _count: { select: { replies: true } },
    },
  });

  const hasMore = rows.length > take;
  const page = hasMore ? rows.slice(0, take) : rows;

  return {
    items: page.map((c) => ({
      id: c.id,
      body: c.body,
      commentType: c.commentType,
      featureKey: c.featureKey,
      authorRole: c.authorRole,
      publicAuthorName:
        c.authorRole === "venue"
          ? `Venue: ${c.author.name}`
          : c.author.name.split(/\s+/)[0] ?? "Community member",
      replyCount: c._count.replies,
      replies: c.replies.map((r) => ({
        id: r.id,
        body: r.body,
        commentType: r.commentType,
        authorRole: r.authorRole,
        publicAuthorName:
          r.authorRole === "venue"
            ? `Venue: ${r.author.name}`
            : r.author.name.split(/\s+/)[0] ?? "Community member",
        createdAt: r.createdAt.toISOString(),
        editedAt: r.editedAt?.toISOString() ?? null,
      })),
      createdAt: c.createdAt.toISOString(),
      editedAt: c.editedAt?.toISOString() ?? null,
      status: c.status,
    })),
    nextCursor: hasMore ? page[page.length - 1]?.id : null,
  };
}
