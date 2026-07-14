import { createMarkerComment } from "@/lib/access-markers/comment-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createMarkerCommentSchema } from "@/lib/validation/access-marker";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ placeId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { placeId } = await params;
  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = createMarkerCommentSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const result = await createMarkerComment({
      placeId,
      userId: user.id,
      commentType: parsed.data.commentType,
      body: parsed.data.body,
      ratingId: parsed.data.ratingId,
      evidencePhotoIds: parsed.data.evidencePhotoIds,
    });
    return jsonOk(
      {
        comment: {
          id: result.comment.id,
          status: result.comment.status,
        },
        needsReview: result.needsReview,
        reasons: result.reasons,
      },
      201
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "MARKER_COMMENT_RATE_LIMIT") {
      return jsonError("Too many comments submitted recently", 429);
    }
    if (msg === "PLACE_NOT_FOUND") return jsonError("Place not found", 404);
    throw e;
  }
}
