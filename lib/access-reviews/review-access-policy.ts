import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export function canCreateReview(user: CurrentUser | null): boolean {
  return Boolean(user);
}

export function canEditReview(
  user: CurrentUser | null,
  reviewerProfileId: string
): boolean {
  if (!user) return false;
  if (isAdminRole(user.primaryRole)) return true;
  return user.id === reviewerProfileId;
}

export function canDeleteReview(
  user: CurrentUser | null,
  reviewerProfileId: string
): boolean {
  // Venue representatives cannot delete community reviews.
  return canEditReview(user, reviewerProfileId);
}

/** Venue owners may respond but never suppress community reviews. */
export async function canVenueRespond(
  user: CurrentUser | null,
  placeId: string
): Promise<boolean> {
  if (!user) return false;
  if (isAdminRole(user.primaryRole)) return true;
  const profile = await prisma.accessVenueProfile.findFirst({
    where: { placeId, ownerUserId: user.id },
  });
  if (profile) return true;
  const claim = await prisma.accessVenueClaim.findFirst({
    where: { placeId, userId: user.id, status: "approved" },
  });
  return Boolean(claim);
}

export function canModerateAccessContent(user: CurrentUser | null): boolean {
  return Boolean(user && isAdminRole(user.primaryRole));
}

export function publicReviewerDisplayName(params: {
  mode: string;
  userName: string;
}): string {
  if (params.mode === "anonymous_public") return "Community member";
  if (params.mode === "first_name") {
    return params.userName.split(/\s+/)[0] ?? "Community member";
  }
  return params.userName;
}
