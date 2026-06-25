import type { CurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export async function getAccessCommunityRoles(userId: string) {
  const memberships = await prisma.accessCommunityMembership.findMany({
    where: { userId },
    select: { role: true, region: true },
  });
  return memberships;
}

export async function isAccessModerator(user: CurrentUser | null) {
  if (!user) return false;
  if (
    isAdminRole(user.primaryRole) ||
    hasPermission(user.primaryRole, "accessibility_map:manage") ||
    hasPermission(user.primaryRole, "access:moderate")
  ) {
    return true;
  }
  const membership = await prisma.accessCommunityMembership.findFirst({
    where: { userId: user.id, role: { in: ["moderator", "admin"] } },
  });
  return Boolean(membership);
}

export async function isVenueOwner(userId: string, placeId: string) {
  const profile = await prisma.accessVenueProfile.findUnique({
    where: { placeId },
  });
  return profile?.ownerUserId === userId;
}

export async function isCouncilPartner(userId: string) {
  const membership = await prisma.accessCommunityMembership.findFirst({
    where: { userId, role: "council_partner" },
  });
  return Boolean(membership);
}
