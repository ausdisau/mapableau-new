import { upsertMarkerRating } from "@/lib/access-markers/rating-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createMarkerRatingSchema } from "@/lib/validation/access-marker";

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

  const parsed = createMarkerRatingSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const { rating, aggregate } = await upsertMarkerRating({
      placeId,
      userId: user.id,
      input: parsed.data,
    });
    return jsonOk(
      {
        rating: {
          id: rating.id,
          status: rating.status,
          updatedAt: rating.updatedAt,
        },
        aggregate,
      },
      201
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "MARKER_RATING_RATE_LIMIT") {
      return jsonError("Too many ratings submitted recently", 429);
    }
    if (msg === "PLACE_NOT_FOUND") return jsonError("Place not found", 404);
    throw e;
  }
}
