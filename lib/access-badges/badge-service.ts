import { prisma } from "@/lib/prisma";

export async function awardBadge(userId: string, badgeId: string) {
  const existing = await prisma.userAccessBadge.findUnique({
    where: { userId_badgeId: { userId, badgeId } },
  });
  if (existing) return existing;

  return prisma.userAccessBadge.create({
    data: { userId, badgeId },
  });
}

export async function getUserBadges(userId: string) {
  return prisma.userAccessBadge.findMany({
    where: { userId },
    include: { badge: true },
    orderBy: { awardedAt: "desc" },
  });
}

export async function awardBadgesForUser(userId: string) {
  const [reportCount, toiletReports, rampReports, sensoryReports] =
    await Promise.all([
      prisma.accessPlaceReview.count({
        where: { reviewerProfileId: userId, status: "published" },
      }),
      prisma.accessPlaceReview.count({
        where: {
          reviewerProfileId: userId,
          status: "published",
          reportType: "toilet",
        },
      }),
      prisma.accessPlaceReview.count({
        where: {
          reviewerProfileId: userId,
          status: "published",
          reportType: { in: ["entrance", "parking"] },
        },
      }),
      prisma.accessPlaceReview.count({
        where: {
          reviewerProfileId: userId,
          status: "published",
          reportType: "sensory",
        },
      }),
    ]);

  const awarded = [];

  if (reportCount >= 1) {
    awarded.push(await awardBadge(userId, "first_report"));
  }
  if (reportCount >= 5) {
    awarded.push(await awardBadge(userId, "local_mapper"));
  }
  if (toiletReports >= 1) {
    awarded.push(await awardBadge(userId, "toilet_tracker"));
  }
  if (rampReports >= 1) {
    awarded.push(await awardBadge(userId, "ramp_ranger"));
  }
  if (sensoryReports >= 1) {
    awarded.push(await awardBadge(userId, "sensory_scout"));
  }

  const verifiedRole = await prisma.userAccessCommunityRole.findUnique({
    where: { userId_role: { userId, role: "verified_mapper" } },
  });
  if (verifiedRole) {
    awarded.push(await awardBadge(userId, "verified_mapper"));
  }

  const ambassadorRole = await prisma.userAccessCommunityRole.findUnique({
    where: { userId_role: { userId, role: "access_ambassador" } },
  });
  if (ambassadorRole) {
    awarded.push(await awardBadge(userId, "access_ambassador"));
  }

  return awarded.filter(Boolean);
}
