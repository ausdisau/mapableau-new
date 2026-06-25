import type { AccessVerificationAction } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { recordContribution } from "@/lib/access-contributions/contribution-service";
import { prisma } from "@/lib/prisma";

const VERIFY_RATE_LIMIT_PER_HOUR = 20;
const DISPUTE_THRESHOLD = 2;

export async function submitVerification(params: {
  userId: string;
  entityType: string;
  entityId: string;
  action: AccessVerificationAction;
  notes?: string;
  evidence?: Record<string, unknown>;
}) {
  const recentCount = await prisma.accessVerification.count({
    where: {
      userId: params.userId,
      createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
    },
  });
  if (recentCount >= VERIFY_RATE_LIMIT_PER_HOUR) {
    throw new Error("VERIFY_RATE_LIMIT");
  }

  const existing = await prisma.accessVerification.findFirst({
    where: {
      userId: params.userId,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
    },
  });
  if (existing) {
    throw new Error("VERIFY_ALREADY_SUBMITTED");
  }

  const verification = await prisma.accessVerification.create({
    data: {
      userId: params.userId,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      notes: params.notes,
      evidence: params.evidence as never,
    },
  });

  await recordContribution({
    userId: params.userId,
    action: "verification_submitted",
    entityType: params.entityType,
    entityId: params.entityId,
  });

  if (params.action === "dispute") {
    await handleDispute(params);
  } else if (params.action === "outdated") {
    await handleOutdated(params);
  } else if (params.action === "resolve_alert") {
    await prisma.accessAlert.updateMany({
      where: { id: params.entityId, status: "active" },
      data: {
        status: "resolved",
        resolvedAt: new Date(),
        resolvedById: params.userId,
      },
    });
  }

  await createAuditEvent({
    actorUserId: params.userId,
    action: `access_verification.${params.action}`,
    entityType: params.entityType,
    entityId: params.entityId,
  });

  return verification;
}

async function handleDispute(params: {
  userId: string;
  entityType: string;
  entityId: string;
  notes?: string;
}) {
  await prisma.accessDispute.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      raisedById: params.userId,
      reason: "inaccurate_access_information",
      details: params.notes,
    },
  });

  const disputeCount = await prisma.accessVerification.count({
    where: {
      entityType: params.entityType,
      entityId: params.entityId,
      action: "dispute",
    },
  });

  if (disputeCount >= DISPUTE_THRESHOLD) {
    if (params.entityType === "AccessPlaceReview") {
      await prisma.accessPlaceReview.update({
        where: { id: params.entityId },
        data: { status: "disputed" },
      });
    } else if (params.entityType === "AccessAlert") {
      await prisma.accessAlert.update({
        where: { id: params.entityId },
        data: { status: "disputed" },
      });
    }

    await prisma.accessModerationQueue.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        flagReason: "Community dispute threshold reached",
        priority: 10,
      },
    });
  }
}

async function handleOutdated(params: {
  entityType: string;
  entityId: string;
}) {
  const outdatedCount = await prisma.accessVerification.count({
    where: {
      entityType: params.entityType,
      entityId: params.entityId,
      action: "outdated",
    },
  });

  if (outdatedCount >= 3 && params.entityType === "AccessPlaceReview") {
    await prisma.accessPlaceReview.update({
      where: { id: params.entityId },
      data: { status: "archived" },
    });
  }
}

export async function getVerificationCounts(
  entityType: string,
  entityId: string
) {
  const verifications = await prisma.accessVerification.groupBy({
    by: ["action"],
    where: { entityType, entityId },
    _count: { action: true },
  });

  return Object.fromEntries(
    verifications.map((v) => [v.action, v._count.action])
  );
}
