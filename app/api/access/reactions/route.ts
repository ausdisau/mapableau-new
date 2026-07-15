import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { setReaction } from "@/lib/access-reviews/reaction-service";
import { accessibilityReviewsV1Enabled } from "@/lib/config/accessibility-reviews";
import { reactionSchema } from "@/lib/validation/access-review";

export async function POST(req: Request) {
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

  const parsed = reactionSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const reaction = await setReaction({
      userId: user.id,
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
      reactionType: parsed.data.reactionType,
      active: parsed.data.active,
    });
    return jsonOk({ reaction });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "NOT_FOUND") return jsonError("Target not found", 404);
    throw e;
  }
}
