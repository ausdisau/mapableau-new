import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getUserBadges } from "@/lib/access-gamification/badge-service";
import { listActiveMappingChallenges } from "@/lib/access-gamification/challenge-service";
import {
  getUserContributionTotals,
  upsertContributionPrivacy,
} from "@/lib/access-gamification/contribution-ledger-service";
import { accessibilityReviewsV1Enabled } from "@/lib/config/accessibility-reviews";

export async function GET() {
  if (!accessibilityReviewsV1Enabled) {
    return jsonError("Accessibility reviews are not enabled", 404);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const [totals, badges, challenges] = await Promise.all([
    getUserContributionTotals(user.id),
    getUserBadges(user.id),
    listActiveMappingChallenges(user.id),
  ]);

  return jsonOk({
    contribution: totals,
    badges,
    challenges,
  });
}

export async function PATCH(req: Request) {
  if (!accessibilityReviewsV1Enabled) {
    return jsonError("Accessibility reviews are not enabled", 404);
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const data = body as {
    hidePointsPublicly?: boolean;
    hideBadgesPublicly?: boolean;
  };

  const privacy = await upsertContributionPrivacy({
    userId: user.id,
    hidePointsPublicly: data.hidePointsPublicly,
    hideBadgesPublicly: data.hideBadgesPublicly,
  });

  return jsonOk({ privacy });
}
