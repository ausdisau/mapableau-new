import type {
  AccessCommentType,
  AccessFeatureAnchor,
  AccessRatingValue,
} from "@prisma/client";

import { evaluateReviewBadges } from "@/lib/access-gamification/badge-service";
import {
  awardContributionPoints,
  reverseContributionPoints,
} from "@/lib/access-gamification/contribution-ledger-service";
import { POINTS_CONFIG } from "@/lib/access-gamification/points-config";
import { scanReviewForModerationFlags } from "@/lib/access-moderation/content-safety-rules";
import { emitAccessNotification } from "@/lib/access-reviews/access-review-events";
import { ratingValueToNumericScore , recomputePlaceRatingSummaries } from "@/lib/access-reviews/review-summary-service";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

const REVIEW_RATE_LIMIT_PER_HOUR = 10;

export type ReviewTagInput = {
  tagKey: string;
  sentiment: "positive" | "barrier";
};

export async function createAccessReview(params: {
  placeId: string;
  reviewerProfileId: string;
  displayNameMode: "named" | "first_name" | "anonymous_public";
  reviewBody: string;
  mobilityContext?: string;
  accessContextJson?: unknown;
  visitDate?: Date;
  visitTimePrecision?: "none" | "approximate" | "exact";
  observationSource?: "in_person" | "venue_inspection" | "other";
  overallExperience?:
    | "completely"
    | "mostly"
    | "partly"
    | "barely"
    | "not_at_all"
    | "prefer_not";
  temporaryIssue?: boolean;
  visibility?: "public" | "mapable_only";
  ratings: { category: string; value: AccessRatingValue }[];
  featureTags?: ReviewTagInput[];
  publish?: boolean;
}) {
  const flags = scanReviewForModerationFlags(params.reviewBody);
  const status = flags.length
    ? "pending"
    : params.publish
      ? "published"
      : "draft";

  const review = await prisma.$transaction(async (tx) => {
    const recentCount = await tx.accessPlaceReview.count({
      where: {
        reviewerProfileId: params.reviewerProfileId,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
    });
    if (recentCount >= REVIEW_RATE_LIMIT_PER_HOUR) {
      throw new Error("REVIEW_RATE_LIMIT");
    }

    if (params.publish) {
      const existingPublished = await tx.accessPlaceReview.findFirst({
        where: {
          placeId: params.placeId,
          reviewerProfileId: params.reviewerProfileId,
          status: "published",
          deletedAt: null,
        },
        select: { id: true },
      });
      if (existingPublished) {
        throw new Error("REVIEW_ALREADY_PUBLISHED");
      }
    }

    return tx.accessPlaceReview.create({
      data: {
        placeId: params.placeId,
        reviewerProfileId: params.reviewerProfileId,
        displayNameMode: params.displayNameMode,
        reviewBody: params.reviewBody,
        mobilityContext: params.mobilityContext,
        accessContextJson: params.accessContextJson as never,
        visitDate: params.visitDate,
        visitTimePrecision: params.visitTimePrecision ?? "none",
        observationSource: params.observationSource ?? "in_person",
        overallExperience: params.overallExperience,
        temporaryIssue: params.temporaryIssue ?? false,
        visibility: params.visibility ?? "public",
        status,
        publishedAt: status === "published" ? new Date() : null,
        ratings: {
          create: params.ratings.map((r) => ({
            category: r.category as never,
            value: r.value,
          })),
        },
        featureTags: params.featureTags?.length
          ? {
              create: params.featureTags.map((t) => ({
                tagKey: t.tagKey,
                sentiment: t.sentiment,
              })),
            }
          : undefined,
        events: {
          create: {
            actorId: params.reviewerProfileId,
            action: "accessibility.review.created",
            metadata: { flags },
          },
        },
      },
      include: { ratings: true, featureTags: true },
    });
  });

  if (flags.length) {
    await prisma.accessModerationQueue.create({
      data: {
        entityType: "AccessPlaceReview",
        entityId: review.id,
        reviewId: review.id,
        flagReason: flags.join("; "),
      },
    });
  }

  await createAuditEvent({
    actorUserId: params.reviewerProfileId,
    action: "accessibility.review.created",
    entityType: "AccessPlaceReview",
    entityId: review.id,
  });

  if (status === "published") {
    await onReviewPublished(review.id, params.reviewerProfileId);
  }

  return review;
}

export async function updateAccessReviewDraft(params: {
  reviewId: string;
  reviewerProfileId: string;
  reviewBody?: string;
  ratings?: { category: string; value: AccessRatingValue }[];
  featureTags?: ReviewTagInput[];
  overallExperience?:
    | "completely"
    | "mostly"
    | "partly"
    | "barely"
    | "not_at_all"
    | "prefer_not";
  temporaryIssue?: boolean;
  visitDate?: Date;
  visitTimePrecision?: "none" | "approximate" | "exact";
  observationSource?: "in_person" | "venue_inspection" | "other";
  accessContextJson?: unknown;
  displayNameMode?: "named" | "first_name" | "anonymous_public";
}) {
  const existing = await prisma.accessPlaceReview.findUnique({
    where: { id: params.reviewId },
  });
  if (!existing) throw new Error("NOT_FOUND");
  if (existing.reviewerProfileId !== params.reviewerProfileId) {
    throw new Error("FORBIDDEN");
  }
  if (existing.status !== "draft" && existing.status !== "pending") {
    throw new Error("NOT_EDITABLE");
  }

  if (params.ratings) {
    await prisma.accessPlaceReviewRating.deleteMany({
      where: { reviewId: params.reviewId },
    });
  }
  if (params.featureTags) {
    await prisma.accessReviewFeatureTag.deleteMany({
      where: { reviewId: params.reviewId },
    });
  }

  return prisma.accessPlaceReview.update({
    where: { id: params.reviewId },
    data: {
      reviewBody: params.reviewBody,
      overallExperience: params.overallExperience,
      temporaryIssue: params.temporaryIssue,
      visitDate: params.visitDate,
      visitTimePrecision: params.visitTimePrecision,
      observationSource: params.observationSource,
      accessContextJson: params.accessContextJson as never,
      displayNameMode: params.displayNameMode,
      ratings: params.ratings
        ? {
            create: params.ratings.map((r) => ({
              category: r.category as never,
              value: r.value,
            })),
          }
        : undefined,
      featureTags: params.featureTags
        ? {
            create: params.featureTags.map((t) => ({
              tagKey: t.tagKey,
              sentiment: t.sentiment,
            })),
          }
        : undefined,
      events: {
        create: {
          actorId: params.reviewerProfileId,
          action: "accessibility.review.updated",
        },
      },
    },
    include: { ratings: true, featureTags: true },
  });
}

export async function submitAccessReview(
  reviewId: string,
  reviewerProfileId: string
) {
  const review = await prisma.accessPlaceReview.findUnique({
    where: { id: reviewId },
    include: { ratings: true, featureTags: true },
  });
  if (!review) throw new Error("NOT_FOUND");
  if (review.reviewerProfileId !== reviewerProfileId) {
    throw new Error("FORBIDDEN");
  }

  const flags = scanReviewForModerationFlags(review.reviewBody);
  const status = flags.length ? "pending" : "published";

  const updated = await prisma.accessPlaceReview.update({
    where: { id: reviewId },
    data: {
      status,
      publishedAt: status === "published" ? new Date() : null,
      events: {
        create: {
          actorId: reviewerProfileId,
          action:
            status === "published"
              ? "accessibility.review.published"
              : "accessibility.review.pending",
        },
      },
    },
  });

  if (flags.length) {
    await prisma.accessModerationQueue.create({
      data: {
        entityType: "AccessPlaceReview",
        entityId: reviewId,
        reviewId,
        flagReason: flags.join("; "),
      },
    });
  }

  if (status === "published") {
    await onReviewPublished(reviewId, reviewerProfileId);
  }

  return updated;
}

async function onReviewPublished(reviewId: string, userId: string) {
  const review = await prisma.accessPlaceReview.findUnique({
    where: { id: reviewId },
    include: { ratings: true, featureTags: true },
  });
  if (!review) return;

  await recomputePlaceRatingSummaries(review.placeId);

  await awardContributionPoints({
    userId,
    contributionType: "complete_review",
    sourceEntityType: "AccessPlaceReview",
    sourceEntityId: reviewId,
    points: POINTS_CONFIG.completeReview,
    reasonCode: "complete_accessibility_review",
    idempotencyKey: `review:complete:${reviewId}`,
  });

  const observed = review.ratings.filter(
    (r) => ratingValueToNumericScore(r.value) != null
  );
  if (observed.length >= 3) {
    await awardContributionPoints({
      userId,
      contributionType: "rate_three_dimensions",
      sourceEntityType: "AccessPlaceReview",
      sourceEntityId: reviewId,
      points: POINTS_CONFIG.rateThreeDimensions,
      reasonCode: "rate_three_observed_dimensions",
      idempotencyKey: `review:three_dims:${reviewId}`,
    });
  }

  await evaluateReviewBadges({
    userId,
    placeId: review.placeId,
    ratedCategories: observed.map((r) => r.category),
    featureTags: review.featureTags.map((t) => t.tagKey),
  });

  await createAuditEvent({
    actorUserId: userId,
    action: "accessibility.review.published",
    entityType: "AccessPlaceReview",
    entityId: reviewId,
  });

  await emitAccessNotification({
    userId,
    event: "accessibility.review.published",
    title: "Accessibility review published",
    body: "Your accessibility review is now published.",
  });
}

export async function publishReview(reviewId: string, moderatorId?: string) {
  const review = await prisma.accessPlaceReview.update({
    where: { id: reviewId },
    data: { status: "published", publishedAt: new Date(), deletedAt: null },
  });

  await onReviewPublished(reviewId, review.reviewerProfileId);

  if (moderatorId) {
    await createAuditEvent({
      actorUserId: moderatorId,
      action: "accessibility.review.published",
      entityType: "AccessPlaceReview",
      entityId: reviewId,
    });
  }

  return review;
}

export async function restrictOrRemoveReview(params: {
  reviewId: string;
  actorUserId: string;
  mode: "restricted" | "removed";
}) {
  const status = params.mode === "removed" ? "hidden" : "hidden";
  const review = await prisma.accessPlaceReview.update({
    where: { id: params.reviewId },
    data: {
      status,
      deletedAt: params.mode === "removed" ? new Date() : null,
      events: {
        create: {
          actorId: params.actorUserId,
          action:
            params.mode === "removed"
              ? "accessibility.review.removed"
              : "accessibility.review.restricted",
        },
      },
    },
  });

  await reverseContributionPoints({
    sourceEntityType: "AccessPlaceReview",
    sourceEntityId: params.reviewId,
    actorUserId: params.actorUserId,
  });

  await recomputePlaceRatingSummaries(review.placeId);

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action:
      params.mode === "removed"
        ? "accessibility.review.removed"
        : "accessibility.review.restricted",
    entityType: "AccessPlaceReview",
    entityId: params.reviewId,
  });

  await emitAccessNotification({
    userId: review.reviewerProfileId,
    event:
      params.mode === "removed"
        ? "accessibility.review.removed"
        : "accessibility.review.restricted",
    title: "Review status updated",
    body: "A moderator updated the status of your accessibility review.",
  });

  return review;
}

export async function listPublishedReviews(placeId: string, cursor?: string) {
  const take = 20;
  const reviews = await prisma.accessPlaceReview.findMany({
    where: {
      placeId,
      status: "published",
      deletedAt: null,
      visibility: "public",
      ...(cursor ? { id: { lt: cursor } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: take + 1,
    include: {
      ratings: true,
      featureTags: true,
      reviewer: { select: { id: true, name: true } },
      _count: { select: { comments: true } },
    },
  });

  const hasMore = reviews.length > take;
  const page = hasMore ? reviews.slice(0, take) : reviews;

  return {
    items: page.map((r) => ({
      id: r.id,
      reviewBody: r.reviewBody,
      overallExperience: r.overallExperience,
      temporaryIssue: r.temporaryIssue,
      visitDate: r.visitDate?.toISOString() ?? null,
      displayNameMode: r.displayNameMode,
      // Never expose accessContextJson publicly
      ratings: r.ratings,
      featureTags: r.featureTags,
      replyCount: r._count.comments,
      createdAt: r.createdAt.toISOString(),
      publishedAt: r.publishedAt?.toISOString() ?? null,
    })),
    nextCursor: hasMore ? page[page.length - 1]?.id : null,
  };
}

/** Compatibility helper used by existing place pages and API routes. */
export async function listPublishedReviewsForPlace(placeId: string) {
  return prisma.accessPlaceReview.findMany({
    where: {
      placeId,
      status: "published",
      deletedAt: null,
      visibility: "public",
    },
    orderBy: { createdAt: "desc" },
    include: { ratings: true, featureTags: true },
  });
}

export type { AccessCommentType, AccessFeatureAnchor };
