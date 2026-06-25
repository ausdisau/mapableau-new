import { getUserBadges } from "@/lib/access-badges/badge-service";
import { getUserContributionStats } from "@/lib/access-badges/contribution-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const [badges, stats] = await Promise.all([
    getUserBadges(user.id),
    getUserContributionStats(user.id),
  ]);

  return jsonOk({
    badges: badges.map((b) => ({
      id: b.badgeId,
      name: b.badge.name,
      description: b.badge.description,
      awardedAt: b.awardedAt,
    })),
    stats,
  });
}
