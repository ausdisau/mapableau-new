import { prisma } from "@/lib/prisma";

export async function recordContribution(params: {
  userId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  points?: number;
}) {
  const contribution = await prisma.userContribution.create({
    data: {
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      points: params.points ?? 1,
    },
  });

  await prisma.accessTrustEvent.create({
    data: {
      entityType: params.entityType ?? "User",
      entityId: params.entityId ?? params.userId,
      eventType: `contribution.${params.action}`,
      metadata: { points: params.points ?? 1 },
    },
  });

  const reportCount = await prisma.userContribution.count({
    where: { userId: params.userId, action: "report_published" },
  });
  if (reportCount >= 3) {
    await prisma.accessCommunityMembership.upsert({
      where: {
        userId_role: { userId: params.userId, role: "community_mapper" },
      },
      create: {
        userId: params.userId,
        role: "community_mapper",
      },
      update: {},
    });
  }

  return contribution;
}

export async function getUserContributionStats(userId: string) {
  const [reports, verifications, alerts, totalPoints] = await Promise.all([
    prisma.userContribution.count({
      where: { userId, action: "report_published" },
    }),
    prisma.userContribution.count({
      where: { userId, action: "verification_submitted" },
    }),
    prisma.userContribution.count({
      where: { userId, action: "alert_created" },
    }),
    prisma.userContribution.aggregate({
      where: { userId },
      _sum: { points: true },
    }),
  ]);

  return {
    reports,
    verifications,
    alerts,
    totalPoints: totalPoints._sum.points ?? 0,
  };
}

export async function getRecentContributions(userId: string, limit = 20) {
  return prisma.userContribution.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
