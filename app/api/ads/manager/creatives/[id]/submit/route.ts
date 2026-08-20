import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  adsManagerErrorResponse,
  assertAdsManagerEnabled,
} from "@/lib/ads/auth/advertiser-access";
import { submitCreativeForReview } from "@/lib/ads/services/manager-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    assertAdsManagerEnabled();
    const user = await requireApiSession();
    if (user instanceof Response) return user;

    const { id } = await context.params;
    try {
      const creative = await submitCreativeForReview(user, id);
      return jsonOk({ creative });
    } catch (e) {
      if (e instanceof Error && e.message === "NOT_FOUND") {
        return jsonError("Not found", 404);
      }
      if (e instanceof Error && e.message === "INVALID_STATUS") {
        return jsonError("Creative must be DRAFT or REJECTED to submit", 400);
      }
      throw e;
    }
  } catch (err) {
    return adsManagerErrorResponse(err);
  }
}
