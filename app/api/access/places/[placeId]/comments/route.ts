import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import {
  createAccessComment,
  listPlaceComments,
} from "@/lib/access-reviews/comment-service";
import {
  canCreateReview,
  canVenueRespond,
} from "@/lib/access-reviews/review-access-policy";
import { accessibilityReviewsV1Enabled } from "@/lib/config/accessibility-reviews";
import { createAccessCommentSchema } from "@/lib/validation/access-review";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ placeId: string }> }
) {
  const { placeId } = await params;
  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor") ?? undefined;
  const result = await listPlaceComments({ placeId, cursor });
  return jsonOk(result);
}

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
  if (!canCreateReview(user)) {
    return jsonError("Sign in required to publish comments", 401);
  }

  const { placeId } = await params;
  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = createAccessCommentSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  let authorRole: string | undefined;
  if (parsed.data.commentType === "venue_response") {
    const allowed = await canVenueRespond(user, placeId);
    if (!allowed) {
      return jsonError("Only verified venue representatives may post venue responses", 403);
    }
    authorRole = "venue";
  }

  const comment = await createAccessComment({
    placeId,
    authorUserId: sessionUser.id,
    body: parsed.data.body,
    commentType: parsed.data.commentType,
    featureKey: parsed.data.featureKey,
    reviewId: parsed.data.reviewId,
    parentCommentId: parsed.data.parentCommentId,
    authorRole,
  });

  return jsonOk({ comment: { id: comment.id, status: comment.status } }, 201);
}
