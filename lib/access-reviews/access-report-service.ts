import type {
  AccessDisplayNameMode,
  AccessRatingValue,
  AccessReportType,
  AccessReviewStatus,
} from "@prisma/client";

import { recomputePlaceDomainSummaries } from "@/lib/access-map/domain-score-service";
import { scanReviewForModerationFlags } from "@/lib/access-moderation/content-safety-rules";
import { recordContribution } from "@/lib/access-badges/contribution-service";
import { awardBadgesForUser } from "@/lib/access-badges/badge-service";
import { grantCommunityMapperIfEligible } from "@/lib/access-badges/community-role-service";
import { recomputePlaceRatingSummaries } from "@/lib/access-reviews/review-summary-service";
import { prisma } from "@/lib/prisma";
import type { Measurement } from "@/lib/validation/access-report";

const REPORT_RATE_LIMIT_PER_HOUR = 10;

export async function createOrUpdateAccessReport(params: {
  placeId: string;
  reviewerProfileId: string;
  reportId?: string;
  reportType?: AccessReportType;
  displayNameMode: AccessDisplayNameMode;
  reviewBody: string;
  mobilityContext?: string;
  visitDate?: Date;
  visitedInPerson?: boolean;
  measurements?: Measurement[];
  visibility?: "public" | "mapable_only";
  ratings: { category: string; value: AccessRatingValue }[];
  publish?: boolean;
  draftKey?: string;
}) {
  const flags = scanReviewForModerationFlags(params.reviewBody);
  const status: AccessReviewStatus = flags.length
    ? "pending"
    : params.publish
      ? "published"
      : "draft";

  const data = {
    reportType: params.reportType ?? "venue",
    displayNameMode: params.displayNameMode,
    reviewBody: params.reviewBody,
    mobilityContext: params.mobilityContext,
    visitDate: params.visitDate,
    visitedInPerson: params.visitedInPerson ?? true,
    measurementsJson: params.measurements?.length
      ? params.measurements
      : undefined,
    draftKey: params.draftKey,
    visibility: params.visibility ?? "public",
    status,
    submittedAt: params.publish ? new Date() : undefined,
    ratings: {
      deleteMany: params.reportId ? {} : undefined,
      create: params.ratings.map((r) => ({
        category: r.category as never,
        value: r.value,
      })),
    },
  };

  const review = await prisma.$transaction(async (tx) => {
    if (!params.reportId) {
      const recentCount = await tx.accessPlaceReview.count({
        where: {
          reviewerProfileId: params.reviewerProfileId,
          createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
        },
      });
      if (recentCount >= REPORT_RATE_LIMIT_PER_HOUR) {
        throw new Error("REPORT_RATE_LIMIT");
      }
    }

    if (params.reportId) {
      await tx.accessPlaceReviewRating.deleteMany({
        where: { reviewId: params.reportId },
      });
      return tx.accessPlaceReview.update({
        where: { id: params.reportId },
        data: {
          ...data,
          ratings: {
            create: params.ratings.map((r) => ({
              category: r.category as never,
              value: r.value,
            })),
          },
        },
        include: { ratings: true },
      });
    }

    if (params.draftKey) {
      const existingDraft = await tx.accessPlaceReview.findFirst({
        where: {
          placeId: params.placeId,
          reviewerProfileId: params.reviewerProfileId,
          draftKey: params.draftKey,
          status: "draft",
        },
      });
      if (existingDraft) {
        await tx.accessPlaceReviewRating.deleteMany({
          where: { reviewId: existingDraft.id },
        });
        return tx.accessPlaceReview.update({
          where: { id: existingDraft.id },
          data: {
            ...data,
            ratings: {
              create: params.ratings.map((r) => ({
                category: r.category as never,
                value: r.value,
              })),
            },
          },
          include: { ratings: true },
        });
      }
    }

    return tx.accessPlaceReview.create({
      data: {
        placeId: params.placeId,
        reviewerProfileId: params.reviewerProfileId,
        ...data,
        events: {
          create: {
            actorId: params.reviewerProfileId,
            action: "report.created",
            metadata: { flags },
          },
        },
      },
      include: { ratings: true },
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

  if (status === "published") {
    await recomputePlaceRatingSummaries(params.placeId);
    await recomputePlaceDomainSummaries(params.placeId);
    await recordContribution({
      userId: params.reviewerProfileId,
      action: "report_submitted",
      entityType: "AccessPlaceReview",
      entityId: review.id,
    });
    await awardBadgesForUser(params.reviewerProfileId);
    await grantCommunityMapperIfEligible(params.reviewerProfileId);
  }

  return review;
}

export async function listPublishedReportsForPlace(placeId: string, take = 20) {
  return prisma.accessPlaceReview.findMany({
    where: { placeId, status: "published", visibility: "public" },
    orderBy: { createdAt: "desc" },
    take,
    include: {
      ratings: true,
      photos: { where: { status: "approved" } },
    },
  });
}

export async function getRecentCommunityFeed(params: {
  limit?: number;
  lat?: number;
  lng?: number;
}) {
  const limit = params.limit ?? 30;
  return prisma.accessPlaceReview.findMany({
    where: { status: "published", visibility: "public" },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      place: {
        select: {
          id: true,
          name: true,
          category: true,
          suburb: true,
          location: true,
        },
      },
      ratings: true,
    },
  });
}
