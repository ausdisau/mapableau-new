import { phase12Config } from "@/lib/config/phase12";
import { prisma } from "@/lib/prisma";

export async function registerCommunityMember(params: {
  memberLabel: string;
  membershipType?: string;
  region?: string;
}) {
  if (!phase12Config.communityGovernanceMembershipEnabled) {
    throw new Error("MEMBERSHIP_DISABLED");
  }
  return prisma.communityGovernanceMembership.create({
    data: {
      memberLabel: params.memberLabel,
      membershipType: params.membershipType ?? "community",
      region: params.region,
    },
  });
}

export async function listPublicMembershipDirectory() {
  if (!phase12Config.communityGovernanceMembershipEnabled) return [];
  return prisma.communityGovernanceMembership.findMany({
    where: { status: "active" },
    orderBy: { joinedAt: "desc" },
    take: 100,
    select: {
      id: true,
      memberLabel: true,
      membershipType: true,
      region: true,
      disclaimer: true,
      joinedAt: true,
    },
  });
}
