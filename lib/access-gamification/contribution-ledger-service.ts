import { POINTS_CONFIG } from "@/lib/access-gamification/points-config";
import { emitAccessNotification } from "@/lib/access-reviews/access-review-events";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function awardContributionPoints(params: {
  userId: string;
  contributionType: string;
  sourceEntityType: string;
  sourceEntityId: string;
  points: number;
  reasonCode: string;
  idempotencyKey: string;
  status?: "pending" | "final";
  moderationReference?: string;
}) {
  const existing = await prisma.accessContributionLedger.findUnique({
    where: { idempotencyKey: params.idempotencyKey },
  });
  if (existing) return existing;

  const entry = await prisma.accessContributionLedger.create({
    data: {
      userId: params.userId,
      contributionType: params.contributionType,
      sourceEntityType: params.sourceEntityType,
      sourceEntityId: params.sourceEntityId,
      points: params.points,
      reasonCode: params.reasonCode,
      status: params.status ?? "final",
      moderationReference: params.moderationReference,
      idempotencyKey: params.idempotencyKey,
    },
  });

  await createAuditEvent({
    actorUserId: params.userId,
    action: "accessibility.points.awarded",
    entityType: "AccessContributionLedger",
    entityId: entry.id,
    metadata: {
      points: params.points,
      reasonCode: params.reasonCode,
    },
  });

  await emitAccessNotification({
    userId: params.userId,
    event: "accessibility.points.awarded",
    title: "Contribution points awarded",
    body: `You earned ${params.points} contribution points.`,
  });

  return entry;
}

export async function reverseContributionPoints(params: {
  sourceEntityType: string;
  sourceEntityId: string;
  actorUserId?: string;
  moderationReference?: string;
}) {
  const entries = await prisma.accessContributionLedger.findMany({
    where: {
      sourceEntityType: params.sourceEntityType,
      sourceEntityId: params.sourceEntityId,
      status: { in: ["pending", "final"] },
    },
  });

  const reversed = [];
  for (const entry of entries) {
    const updated = await prisma.accessContributionLedger.update({
      where: { id: entry.id },
      data: {
        status: "reversed",
        reversedAt: new Date(),
        moderationReference:
          params.moderationReference ?? entry.moderationReference,
      },
    });
    reversed.push(updated);

    await createAuditEvent({
      actorUserId: params.actorUserId,
      action: "accessibility.points.reversed",
      entityType: "AccessContributionLedger",
      entityId: entry.id,
    });

    await emitAccessNotification({
      userId: entry.userId,
      event: "accessibility.points.reversed",
      title: "Contribution points reversed",
      body: "Points linked to removed or restricted content were reversed.",
    });
  }

  return reversed;
}

export async function awardHelpfulReactionPoints(params: {
  recipientUserId: string;
  reactorUserId: string;
  targetType: string;
  targetId: string;
}) {
  if (params.recipientUserId === params.reactorUserId) {
    return null;
  }

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const todayReactionPoints = await prisma.accessContributionLedger.aggregate({
    where: {
      userId: params.recipientUserId,
      contributionType: "helpful_reaction_received",
      status: "final",
      awardedAt: { gte: startOfDay },
    },
    _sum: { points: true },
  });

  const already =
    todayReactionPoints._sum.points ?? 0;
  if (already >= POINTS_CONFIG.dailyReactionPointsCap) {
    return null;
  }

  return awardContributionPoints({
    userId: params.recipientUserId,
    contributionType: "helpful_reaction_received",
    sourceEntityType: params.targetType,
    sourceEntityId: params.targetId,
    points: POINTS_CONFIG.helpfulReactionReceived,
    reasonCode: "helpful_reaction",
    idempotencyKey: `helpful:${params.targetType}:${params.targetId}:${params.reactorUserId}`,
    status: "final",
  });
}

export async function getUserContributionTotals(userId: string) {
  const [entries, privacy] = await Promise.all([
    prisma.accessContributionLedger.findMany({
      where: { userId, status: "final" },
      orderBy: { awardedAt: "desc" },
      take: 50,
    }),
    prisma.accessContributionPrivacy.findUnique({ where: { userId } }),
  ]);

  const totalPoints = entries.reduce((a, e) => a + e.points, 0);
  const level =
    totalPoints >= 200
      ? "Experienced contributor"
      : totalPoints >= 50
        ? "Active contributor"
        : totalPoints > 0
          ? "New contributor"
          : "Getting started";

  return {
    totalPoints,
    level,
    recent: entries.slice(0, 10).map((e) => ({
      id: e.id,
      contributionType: e.contributionType,
      points: e.points,
      reasonCode: e.reasonCode,
      awardedAt: e.awardedAt.toISOString(),
    })),
    privacy: {
      hidePointsPublicly: privacy?.hidePointsPublicly ?? false,
      hideBadgesPublicly: privacy?.hideBadgesPublicly ?? false,
    },
  };
}

export async function upsertContributionPrivacy(params: {
  userId: string;
  hidePointsPublicly?: boolean;
  hideBadgesPublicly?: boolean;
}) {
  return prisma.accessContributionPrivacy.upsert({
    where: { userId: params.userId },
    create: {
      userId: params.userId,
      hidePointsPublicly: params.hidePointsPublicly ?? false,
      hideBadgesPublicly: params.hideBadgesPublicly ?? false,
    },
    update: {
      ...(params.hidePointsPublicly != null
        ? { hidePointsPublicly: params.hidePointsPublicly }
        : {}),
      ...(params.hideBadgesPublicly != null
        ? { hideBadgesPublicly: params.hideBadgesPublicly }
        : {}),
    },
  });
}
