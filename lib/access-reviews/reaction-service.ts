import type {
  AccessReactionTargetType,
  AccessReactionType,
} from "@prisma/client";

import {
  awardBadgeOnce,
} from "@/lib/access-gamification/badge-service";
import {
  awardContributionPoints,
  awardHelpfulReactionPoints,
} from "@/lib/access-gamification/contribution-ledger-service";
import { POINTS_CONFIG } from "@/lib/access-gamification/points-config";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { emitAccessNotification } from "@/lib/access-reviews/access-review-events";
import { prisma } from "@/lib/prisma";

async function resolveTargetAuthor(
  targetType: AccessReactionTargetType,
  targetId: string
): Promise<{ authorId: string; placeId?: string } | null> {
  if (targetType === "review") {
    const review = await prisma.accessPlaceReview.findUnique({
      where: { id: targetId },
      select: { reviewerProfileId: true, placeId: true },
    });
    if (!review) return null;
    return { authorId: review.reviewerProfileId, placeId: review.placeId };
  }
  const comment = await prisma.accessPlaceComment.findUnique({
    where: { id: targetId },
    select: { authorUserId: true, placeId: true },
  });
  if (!comment) return null;
  return { authorId: comment.authorUserId, placeId: comment.placeId };
}

export async function setReaction(params: {
  userId: string;
  targetType: AccessReactionTargetType;
  targetId: string;
  reactionType: AccessReactionType;
  active: boolean;
}) {
  const target = await resolveTargetAuthor(params.targetType, params.targetId);
  if (!target) throw new Error("NOT_FOUND");

  // Venue owners should not earn points from reacting to their own listing content
  // more generally — self-reactions never earn points.
  if (!params.active) {
    const existing = await prisma.accessReaction.findUnique({
      where: {
        userId_targetType_targetId_reactionType: {
          userId: params.userId,
          targetType: params.targetType,
          targetId: params.targetId,
          reactionType: params.reactionType,
        },
      },
    });
    if (!existing) return null;
    return prisma.accessReaction.update({
      where: { id: existing.id },
      data: { clearedAt: new Date() },
    });
  }

  const reaction = await prisma.accessReaction.upsert({
    where: {
      userId_targetType_targetId_reactionType: {
        userId: params.userId,
        targetType: params.targetType,
        targetId: params.targetId,
        reactionType: params.reactionType,
      },
    },
    create: {
      userId: params.userId,
      targetType: params.targetType,
      targetId: params.targetId,
      reactionType: params.reactionType,
    },
    update: { clearedAt: null },
  });

  await createAuditEvent({
    actorUserId: params.userId,
    action: `accessibility.reaction.${params.reactionType}`,
    entityType:
      params.targetType === "review"
        ? "AccessPlaceReview"
        : "AccessPlaceComment",
    entityId: params.targetId,
  });

  if (params.reactionType === "helpful") {
    await awardHelpfulReactionPoints({
      recipientUserId: target.authorId,
      reactorUserId: params.userId,
      targetType: params.targetType,
      targetId: params.targetId,
    });
  }

  if (params.reactionType === "confirm") {
    await awardContributionPoints({
      userId: params.userId,
      contributionType: "confirm_information",
      sourceEntityType:
        params.targetType === "review"
          ? "AccessPlaceReview"
          : "AccessPlaceComment",
      sourceEntityId: params.targetId,
      points: POINTS_CONFIG.confirmOlderInformation,
      reasonCode: "confirm_older_information",
      idempotencyKey: `confirm:${params.targetType}:${params.targetId}:${params.userId}`,
    });
    await awardBadgeOnce({
      userId: params.userId,
      badgeKey: "information_confirmer",
    });
    if (target.authorId !== params.userId) {
      await emitAccessNotification({
        userId: target.authorId,
        event: "accessibility.review.confirmed",
        title: "Information confirmed",
        body: "Someone confirmed your accessibility information is still current.",
      });
    }
  }

  return reaction;
}

export async function countReactions(
  targetType: AccessReactionTargetType,
  targetId: string
) {
  const rows = await prisma.accessReaction.groupBy({
    by: ["reactionType"],
    where: { targetType, targetId, clearedAt: null },
    _count: true,
  });
  const out: Record<string, number> = {
    helpful: 0,
    confirm: 0,
    changed: 0,
  };
  for (const r of rows) {
    out[r.reactionType] = r._count;
  }
  return out;
}
