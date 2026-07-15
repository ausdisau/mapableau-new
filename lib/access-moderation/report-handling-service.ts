import { reverseContributionPoints } from "@/lib/access-gamification/contribution-ledger-service";
import { emitAccessNotification } from "@/lib/access-reviews/access-review-events";
import {
  restrictOrRemoveReview,
  publishReview,
} from "@/lib/access-reviews/access-review-service";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { createSupportTicket } from "@/lib/support/ticket-service";

const PROTECTED_REASONS = new Set([
  "serious_safety_concern",
  "private_information",
  "privacy_concern",
]);

export async function listContentReports(status = "pending") {
  return prisma.accessContentReport.findMany({
    where: { status: status as never },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function createContentReport(params: {
  entityType: string;
  entityId: string;
  reporterId: string;
  reason: string;
  details?: string;
}) {
  const protectedReport = PROTECTED_REASONS.has(params.reason);

  const report = await prisma.accessContentReport.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      reporterId: params.reporterId,
      reason: params.reason as never,
      details: protectedReport
        ? "[Protected report — details held for authorised staff only]"
        : params.details,
      status: protectedReport ? "escalated" : "pending",
    },
  });

  await prisma.accessModerationQueue.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      reviewId:
        params.entityType === "AccessPlaceReview" ? params.entityId : null,
      flagReason: params.reason,
      priority: protectedReport ? 100 : 0,
      status: protectedReport ? "escalated" : "pending",
    },
  });

  if (protectedReport) {
    await createSupportTicket({
      title: "Protected accessibility report",
      description:
        "A serious safety or privacy report was submitted against accessibility content. Review in the protected support workflow. Public status should remain: Under review.",
      category: "safeguarding_concern",
      priority: "urgent",
      createdById: params.reporterId,
      requiresIncidentReview: true,
    });
  }

  await createAuditEvent({
    actorUserId: params.reporterId,
    action: "accessibility.comment.reported",
    entityType: "AccessContentReport",
    entityId: report.id,
    metadata: {
      protected: protectedReport,
      reason: params.reason,
    },
  });

  return {
    id: report.id,
    status: protectedReport ? "under_review" : report.status,
    publicState: protectedReport ? "Under review" : "Received",
  };
}

/** Venue-safe serializer: never return reporter identity or moderation notes. */
export function publicReportState(status: string): string {
  if (status === "escalated" || status === "pending") return "Under review";
  if (status === "approved") return "Reviewed";
  if (status === "rejected") return "Closed";
  if (status === "hidden") return "Restricted";
  return "Under review";
}

export async function listModerationQueue(status = "pending") {
  return prisma.accessModerationQueue.findMany({
    where: { status: status as never },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    include: { review: { include: { place: true } } },
    take: 100,
  });
}

export async function decideModeration(params: {
  queueId: string;
  moderatorId: string;
  status: "approved" | "rejected" | "hidden" | "needs_changes" | "escalated";
  notes?: string;
}) {
  const item = await prisma.accessModerationQueue.update({
    where: { id: params.queueId },
    data: { status: params.status as never },
    include: { review: true },
  });

  await prisma.accessModerationDecision.create({
    data: {
      queueId: params.queueId,
      moderatorId: params.moderatorId,
      status: params.status as never,
      notes: params.notes,
    },
  });

  if (item.reviewId) {
    if (params.status === "approved") {
      await publishReview(item.reviewId, params.moderatorId);
    } else if (params.status === "rejected" || params.status === "hidden") {
      await restrictOrRemoveReview({
        reviewId: item.reviewId,
        actorUserId: params.moderatorId,
        mode: params.status === "rejected" ? "removed" : "restricted",
      });
    }
  } else if (
    item.entityType === "AccessPlaceComment" &&
    (params.status === "rejected" || params.status === "hidden")
  ) {
    await prisma.accessPlaceComment.update({
      where: { id: item.entityId },
      data: {
        status: "removed",
        moderationStatus: params.status === "rejected" ? "rejected" : "hidden",
      },
    });
    await reverseContributionPoints({
      sourceEntityType: "AccessPlaceComment",
      sourceEntityId: item.entityId,
      actorUserId: params.moderatorId,
    });
  }

  return item;
}

export { publishReview, emitAccessNotification };
