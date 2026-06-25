import { prisma } from "@/lib/prisma";

export async function grantCommunityMapperIfEligible(userId: string) {
  const publishedCount = await prisma.accessPlaceReview.count({
    where: { reviewerProfileId: userId, status: "published" },
  });
  if (publishedCount < 1) return null;

  return prisma.userAccessCommunityRole.upsert({
    where: { userId_role: { userId, role: "community_mapper" } },
    create: { userId, role: "community_mapper" },
    update: {},
  });
}

export async function hasCommunityRole(
  userId: string,
  role: "community_mapper" | "verified_mapper" | "access_ambassador" | "venue_owner" | "moderator" | "council_partner"
) {
  const found = await prisma.userAccessCommunityRole.findUnique({
    where: { userId_role: { userId, role } },
  });
  return Boolean(found);
}

export async function canPublishReportWithoutReview(userId: string) {
  return hasCommunityRole(userId, "verified_mapper");
}
