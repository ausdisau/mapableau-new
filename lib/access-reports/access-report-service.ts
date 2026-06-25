import type {
  AccessDisplayNameMode,
  AccessRatingValue,
  AccessReportType,
} from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { recordContribution } from "@/lib/access-contributions/contribution-service";
import { awardBadgeIfEligible } from "@/lib/access-contributions/badge-service";
import { scanReviewForModerationFlags } from "@/lib/access-moderation/content-safety-rules";
import { recomputePlaceRatingSummaries } from "@/lib/access-reviews/review-summary-service";
import { prisma } from "@/lib/prisma";
import type {
  CreateAccessReportInput,
  UpdateAccessReportInput,
} from "@/lib/validation/access-report";

const REPORT_RATE_LIMIT_PER_HOUR = 10;

function resolveStatus(
  body: string,
  publish: boolean,
  flags: string[]
): "draft" | "pending" | "published" {
  if (!publish) return "draft";
  if (flags.length) return "pending";
  return "published";
}

export async function createAccessReport(params: {
  placeId: string;
  reviewerProfileId: string;
  input: CreateAccessReportInput;
}) {
  const { input } = params;
  const flags = scanReviewForModerationFlags(input.reviewBody);
  const status = resolveStatus(input.reviewBody, input.publish, flags);

  const review = await prisma.$transaction(async (tx) => {
    const recentCount = await tx.accessPlaceReview.count({
      where: {
        reviewerProfileId: params.reviewerProfileId,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
    });
    if (recentCount >= REPORT_RATE_LIMIT_PER_HOUR) {
      throw new Error("REPORT_RATE_LIMIT");
    }

    if (input.publish) {
      const existingPublished = await tx.accessPlaceReview.findFirst({
        where: {
          placeId: params.placeId,
          reviewerProfileId: params.reviewerProfileId,
          status: "published",
        },
        select: { id: true },
      });
      if (existingPublished) {
        throw new Error("REPORT_ALREADY_PUBLISHED");
      }
    }

    return tx.accessPlaceReview.create({
      data: {
        placeId: params.placeId,
        reviewerProfileId: params.reviewerProfileId,
        displayNameMode: input.displayNameMode as AccessDisplayNameMode,
        reviewBody: input.reviewBody,
        mobilityContext: input.mobilityContext,
        evidenceNotes: input.evidenceNotes,
        visitedInPerson: input.visitedInPerson,
        reportType: input.reportType as AccessReportType,
        measurements: input.measurements ?? undefined,
        visitDate: input.visitDate ? new Date(input.visitDate) : undefined,
        visibility: input.visibility ?? "public",
        status,
        ratings: {
          create: input.ratings.map((r) => ({
            category: r.category as never,
            value: r.value as AccessRatingValue,
          })),
        },
        events: {
          create: {
            actorId: params.reviewerProfileId,
            action: "report.created",
            metadata: { flags, reportType: input.reportType },
          },
        },
      },
      include: { ratings: true, photos: true },
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
    action: "access_report.created",
    entityType: "AccessPlaceReview",
    entityId: review.id,
  });

  if (status === "published") {
    await recomputePlaceRatingSummaries(params.placeId);
    await recordContribution({
      userId: params.reviewerProfileId,
      action: "report_published",
      entityType: "AccessPlaceReview",
      entityId: review.id,
    });
    await awardBadgeIfEligible(params.reviewerProfileId, "first_report");
    if (input.reportType === "toilet") {
      await awardBadgeIfEligible(params.reviewerProfileId, "toilet_tracker");
    }
  }

  return review;
}

export async function updateAccessReport(params: {
  reportId: string;
  userId: string;
  input: UpdateAccessReportInput;
  isModerator?: boolean;
}) {
  const existing = await prisma.accessPlaceReview.findUnique({
    where: { id: params.reportId },
    include: { ratings: true },
  });
  if (!existing) throw new Error("REPORT_NOT_FOUND");
  if (
    existing.reviewerProfileId !== params.userId &&
    !params.isModerator
  ) {
    throw new Error("REPORT_FORBIDDEN");
  }
  if (existing.status === "published" && !params.isModerator) {
    throw new Error("REPORT_ALREADY_PUBLISHED");
  }

  const body = params.input.reviewBody ?? existing.reviewBody;
  const flags = scanReviewForModerationFlags(body);
  const publish = params.input.publish ?? false;
  const status = publish ? resolveStatus(body, true, flags) : existing.status;

  const review = await prisma.$transaction(async (tx) => {
    if (params.input.ratings?.length) {
      await tx.accessPlaceReviewRating.deleteMany({
        where: { reviewId: params.reportId },
      });
    }

    return tx.accessPlaceReview.update({
      where: { id: params.reportId },
      data: {
        reviewBody: params.input.reviewBody,
        mobilityContext: params.input.mobilityContext,
        evidenceNotes: params.input.evidenceNotes,
        visitedInPerson: params.input.visitedInPerson,
        reportType: params.input.reportType as AccessReportType | undefined,
        measurements: params.input.measurements ?? undefined,
        visitDate: params.input.visitDate
          ? new Date(params.input.visitDate)
          : undefined,
        status,
        ratings: params.input.ratings?.length
          ? {
              create: params.input.ratings.map((r) => ({
                category: r.category as never,
                value: r.value as AccessRatingValue,
              })),
            }
          : undefined,
        events: {
          create: {
            actorId: params.userId,
            action: publish ? "report.published" : "report.updated",
            metadata: { flags },
          },
        },
      },
      include: { ratings: true, photos: true },
    });
  });

  if (flags.length && publish) {
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
    await recomputePlaceRatingSummaries(review.placeId);
    await recordContribution({
      userId: params.userId,
      action: "report_published",
      entityType: "AccessPlaceReview",
      entityId: review.id,
    });
    await awardBadgeIfEligible(params.userId, "first_report");
  }

  return review;
}

export async function getDraftReportForUser(placeId: string, userId: string) {
  return prisma.accessPlaceReview.findFirst({
    where: {
      placeId,
      reviewerProfileId: userId,
      status: "draft",
    },
    include: { ratings: true, photos: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function listReportsFeed(placeId: string, limit = 20) {
  return prisma.accessPlaceReview.findMany({
    where: { placeId, status: "published", visibility: "public" },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      ratings: true,
      photos: { where: { status: "approved" } },
    },
  });
}

export async function addReportPhoto(params: {
  reportId: string;
  userId: string;
  storagePath: string;
  mimeType: string;
  altText: string;
}) {
  const report = await prisma.accessPlaceReview.findUnique({
    where: { id: params.reportId },
  });
  if (!report) throw new Error("REPORT_NOT_FOUND");
  if (report.reviewerProfileId !== params.userId) {
    throw new Error("REPORT_FORBIDDEN");
  }

  const photo = await prisma.accessPlaceReviewPhoto.create({
    data: {
      reviewId: params.reportId,
      storagePath: params.storagePath,
      mimeType: params.mimeType,
      altText: params.altText,
      status: "pending",
    },
  });

  await prisma.accessModerationQueue.create({
    data: {
      entityType: "AccessPlaceReviewPhoto",
      entityId: photo.id,
      reviewId: params.reportId,
      flagReason: "Photo pending privacy review",
    },
  });

  return photo;
}
