import { getUserBadges } from "@/lib/access-contributions/badge-service";
import {
  getRecentContributions,
  getUserContributionStats,
} from "@/lib/access-contributions/contribution-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const [badges, stats, recent] = await Promise.all([
    getUserBadges(user.id),
    getUserContributionStats(user.id),
    getRecentContributions(user.id),
  ]);

  return jsonOk({
    badges: badges.map((b) => ({
      code: b.badge.code,
      title: b.badge.title,
      description: b.badge.description,
      earnedAt: b.earnedAt,
    })),
    stats,
    recent,
  });
}
