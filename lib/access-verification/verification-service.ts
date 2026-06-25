import type {
  AccessVerificationAction,
  AccessVerificationTarget,
  Prisma,
} from "@prisma/client";

import { recordContribution } from "@/lib/access-badges/contribution-service";
import { resolveAccessAlert } from "@/lib/access-alerts/access-alert-service";
import { prisma } from "@/lib/prisma";

export async function addAccessVerification(params: {
  targetType: AccessVerificationTarget;
  targetId: string;
  action: AccessVerificationAction;
  userId: string;
  notes?: string;
  evidenceJson?: Record<string, unknown>;
}) {
  const verification = await prisma.accessVerification.upsert({
    where: {
      targetType_targetId_userId_action: {
        targetType: params.targetType,
        targetId: params.targetId,
        userId: params.userId,
        action: params.action,
      },
    },
    create: {
      targetType: params.targetType,
      targetId: params.targetId,
      action: params.action,
      userId: params.userId,
      notes: params.notes,
      evidenceJson: params.evidenceJson as Prisma.InputJsonValue | undefined,
    },
    update: {
      notes: params.notes,
      evidenceJson: params.evidenceJson as Prisma.InputJsonValue | undefined,
    },
  });

  if (params.targetType === "alert" && params.action === "resolve") {
    await resolveAccessAlert({
      alertId: params.targetId,
      resolvedById: params.userId,
    });
  }

  if (params.targetType === "review" && params.action === "dispute") {
    await prisma.accessPlaceReview.update({
      where: { id: params.targetId },
      data: { status: "pending" },
    });
    await prisma.accessModerationQueue.create({
      data: {
        entityType: "AccessPlaceReview",
        entityId: params.targetId,
        reviewId: params.targetId,
        flagReason: "Community dispute",
        priority: 2,
      },
    });
  }

  await recordContribution({
    userId: params.userId,
    action: `verification_${params.action}`,
    entityType: params.targetType,
    entityId: params.targetId,
  });

  return verification;
}

export async function getVerificationCounts(
  targetType: AccessVerificationTarget,
  targetId: string
) {
  const rows = await prisma.accessVerification.groupBy({
    by: ["action"],
    where: { targetType, targetId },
    _count: { action: true },
  });
  return Object.fromEntries(rows.map((r) => [r.action, r._count.action]));
}
