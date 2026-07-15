import { awardBadgeOnce } from "@/lib/access-gamification/badge-service";
import {
  awardContributionPoints,
} from "@/lib/access-gamification/contribution-ledger-service";
import { POINTS_CONFIG } from "@/lib/access-gamification/points-config";
import { emitAccessNotification } from "@/lib/access-reviews/access-review-events";
import { recordIssueHistory } from "@/lib/access-reviews/issue-timeline-service";
import {
  canVenueRespond,
  canCreateReview,
} from "@/lib/access-reviews/review-access-policy";
import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/current-user";
import { accessibilityReviewsV1Enabled } from "@/lib/config/accessibility-reviews";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ placeId: string }> }
) {
  if (!accessibilityReviewsV1Enabled) {
    return jsonError("Accessibility reviews are not enabled", 404);
  }

  const sessionUser = await requireApiSession();
  if (sessionUser instanceof Response) return sessionUser;
  const user = await getCurrentUser();
  if (!canCreateReview(user)) return jsonError("Sign in required", 401);

  const { placeId } = await params;
  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const data = body as {
    action: "investigate" | "resolve" | "reopen" | "confirm_resolution";
    reviewId?: string;
    commentId?: string;
    note?: string;
  };

  if (data.action === "investigate" || data.action === "resolve") {
    const allowed = await canVenueRespond(user, placeId);
    if (!allowed) {
      return jsonError(
        "Only verified venue representatives may update issue investigation status",
        403
      );
    }
  }

  const state =
    data.action === "investigate"
      ? "being_investigated"
      : data.action === "resolve"
        ? "resolved"
        : data.action === "reopen"
          ? "reopened"
          : "confirmed";

  const row = await recordIssueHistory({
    placeId,
    state,
    actorId: sessionUser.id,
    reviewId: data.reviewId,
    commentId: data.commentId,
    note: data.note,
  });

  if (data.action === "confirm_resolution") {
    await awardContributionPoints({
      userId: sessionUser.id,
      contributionType: "confirm_barrier_resolved",
      sourceEntityType: "AccessIssueHistory",
      sourceEntityId: row.id,
      points: POINTS_CONFIG.confirmBarrierResolved,
      reasonCode: "confirm_barrier_resolved",
      idempotencyKey: `resolve_confirm:${row.id}:${sessionUser.id}`,
    });
    await awardBadgeOnce({
      userId: sessionUser.id,
      badgeKey: "barrier_resolution_confirmed",
    });
  }

  await emitAccessNotification({
    userId: sessionUser.id,
    event:
      data.action === "reopen"
        ? "accessibility.issue.reopened"
        : "accessibility.issue.resolved",
    title: "Accessibility issue update",
    body: "An accessibility issue status was updated.",
  });

  return jsonOk({ history: { id: row.id, state: row.state } }, 201);
}
