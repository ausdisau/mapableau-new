import {
  BADGE_DEFINITIONS,
  type BadgeKey,
} from "@/lib/access-gamification/points-config";
import { emitAccessNotification } from "@/lib/access-reviews/access-review-events";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function ensureBadgeDefinitions() {
  for (const badge of BADGE_DEFINITIONS) {
    await prisma.accessBadgeDefinition.upsert({
      where: { key: badge.key },
      create: {
        key: badge.key,
        title: badge.title,
        description: badge.description,
        category: badge.category,
      },
      update: {
        title: badge.title,
        description: badge.description,
        category: badge.category,
        active: true,
      },
    });
  }
}

export async function awardBadgeOnce(params: {
  userId: string;
  badgeKey: BadgeKey;
  metadata?: Record<string, unknown>;
}) {
  await ensureBadgeDefinitions();

  const existing = await prisma.accessUserBadge.findUnique({
    where: {
      userId_badgeKey: {
        userId: params.userId,
        badgeKey: params.badgeKey,
      },
    },
  });
  if (existing) return existing;

  const def = BADGE_DEFINITIONS.find((b) => b.key === params.badgeKey);
  const award = await prisma.accessUserBadge.create({
    data: {
      userId: params.userId,
      badgeKey: params.badgeKey,
      metadata: (params.metadata ?? undefined) as never,
    },
  });

  await createAuditEvent({
    actorUserId: params.userId,
    action: "accessibility.badge.earned",
    entityType: "AccessUserBadge",
    entityId: award.id,
    metadata: { badgeKey: params.badgeKey },
  });

  await emitAccessNotification({
    userId: params.userId,
    event: "accessibility.badge.earned",
    title: "Badge earned",
    body: def?.title ?? "You earned a new badge.",
  });

  return award;
}

export async function getUserBadges(userId: string) {
  await ensureBadgeDefinitions();
  const [awards, privacy] = await Promise.all([
    prisma.accessUserBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { awardedAt: "desc" },
    }),
    prisma.accessContributionPrivacy.findUnique({ where: { userId } }),
  ]);

  return {
    hideBadgesPublicly: privacy?.hideBadgesPublicly ?? false,
    badges: awards.map((a) => ({
      key: a.badgeKey,
      title: a.badge.title,
      description: a.badge.description,
      category: a.badge.category,
      awardedAt: a.awardedAt.toISOString(),
    })),
  };
}

export async function evaluateReviewBadges(params: {
  userId: string;
  placeId: string;
  ratedCategories: string[];
  featureTags: string[];
}) {
  const publishedCount = await prisma.accessPlaceReview.count({
    where: {
      reviewerProfileId: params.userId,
      status: "published",
      deletedAt: null,
    },
  });

  if (publishedCount === 1) {
    await awardBadgeOnce({
      userId: params.userId,
      badgeKey: "first_accessibility_review",
    });
  }

  const distinctPlaces = await prisma.accessPlaceReview.findMany({
    where: {
      reviewerProfileId: params.userId,
      status: "published",
      deletedAt: null,
    },
    distinct: ["placeId"],
    select: { placeId: true },
  });
  if (distinctPlaces.length >= 5) {
    await awardBadgeOnce({
      userId: params.userId,
      badgeKey: "five_locations_reviewed",
    });
  }

  if (
    params.ratedCategories.includes("accessible_toilet") ||
    params.featureTags.some((t) =>
      ["accessible_toilet", "changing_places"].includes(t)
    )
  ) {
    await awardBadgeOnce({
      userId: params.userId,
      badgeKey: "accessible_toilet_contributor",
    });
  }

  if (
    params.ratedCategories.includes("lighting_acoustics") ||
    params.featureTags.some((t) =>
      ["quiet_area", "high_noise", "glare_flashing_light"].includes(t)
    )
  ) {
    await awardBadgeOnce({
      userId: params.userId,
      badgeKey: "sensory_information_contributor",
    });
  }

  if (
    params.ratedCategories.some((c) =>
      ["accessible_parking", "public_transport_dropoff"].includes(c)
    ) ||
    params.featureTags.some((t) =>
      ["accessible_parking", "accessible_dropoff"].includes(t)
    )
  ) {
    await awardBadgeOnce({
      userId: params.userId,
      badgeKey: "transport_access_contributor",
    });
  }
}
