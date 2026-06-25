import { prisma } from "@/lib/prisma";

export async function recordContribution(params: {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
}) {
  return prisma.userAccessContribution.create({
    data: params,
  });
}

export async function getUserContributions(userId: string, limit = 50) {
  return prisma.userAccessContribution.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getUserContributionStats(userId: string) {
  const [reports, alerts, verifications] = await Promise.all([
    prisma.userAccessContribution.count({
      where: { userId, action: "report_submitted" },
    }),
    prisma.userAccessContribution.count({
      where: { userId, action: "alert_created" },
    }),
    prisma.userAccessContribution.count({
      where: {
        userId,
        action: { startsWith: "verification_" },
      },
    }),
  ]);
  return { reports, alerts, verifications };
}
