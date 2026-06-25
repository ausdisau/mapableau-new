import { prisma } from "@/lib/prisma";

const BADGE_THRESHOLDS: Record<string, { action: string; count: number }> = {
  first_report: { action: "report_published", count: 1 },
  local_mapper: { action: "report_published", count: 5 },
  toilet_tracker: { action: "report_published", count: 3 },
  ramp_ranger: { action: "report_published", count: 3 },
  sensory_scout: { action: "report_published", count: 3 },
};

export async function awardBadgeIfEligible(userId: string, badgeCode: string) {
  const badge = await prisma.accessBadge.findUnique({
    where: { code: badgeCode },
  });
  if (!badge) return null;

  const existing = await prisma.userAccessBadge.findUnique({
    where: { userId_badgeId: { userId, badgeId: badge.id } },
  });
  if (existing) return existing;

  const threshold = BADGE_THRESHOLDS[badgeCode];
  if (threshold) {
    const count = await prisma.userContribution.count({
      where: { userId, action: threshold.action },
    });
    if (count < threshold.count) return null;
  }

  const awarded = await prisma.userAccessBadge.create({
    data: {
      userId,
      badgeId: badge.id,
    },
    include: { badge: true },
  });

  await prisma.accessTrustEvent.create({
    data: {
      entityType: "User",
      entityId: userId,
      eventType: "badge.earned",
      metadata: { badgeCode },
    },
  });

  return awarded;
}

export async function getUserBadges(userId: string) {
  return prisma.userAccessBadge.findMany({
    where: { userId },
    include: { badge: true },
    orderBy: { earnedAt: "desc" },
  });
}

export async function grantBadge(userId: string, badgeCode: string) {
  const badge = await prisma.accessBadge.findUnique({
    where: { code: badgeCode },
  });
  if (!badge) throw new Error("BADGE_NOT_FOUND");

  return prisma.userAccessBadge.upsert({
    where: { userId_badgeId: { userId, badgeId: badge.id } },
    create: { userId, badgeId: badge.id },
    update: {},
    include: { badge: true },
  });
}
