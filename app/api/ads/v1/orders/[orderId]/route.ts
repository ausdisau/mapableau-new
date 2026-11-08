import { requireAdvertiserAccess } from "@/lib/ads/auth/advertiser-access";
import { userHasAdsPermission } from "@/lib/ads/auth/ads-permissions";
import {
  assertPlacementApiEnabled,
  placementApiDisabledResponse,
} from "@/lib/ads/manager/flag-gate";
import {
  getPlacementOrderForAdvertiser,
  serializeOrder,
} from "@/lib/ads/placement/orders";
import { OrganisationAccessError } from "@/lib/api/organisation-scope";
import { jsonError, jsonOk } from "@/lib/api/response";
import { apiForbidden, apiUnauthorized, getApiUser } from "@/lib/auth/guards";

type Ctx = { params: Promise<{ orderId: string }> };

/** GET /api/ads/v1/orders/{orderId} */
export async function GET(request: Request, context: Ctx) {
  if (!assertPlacementApiEnabled()) return placementApiDisabledResponse();

  const user = await getApiUser();
  if (!user) return apiUnauthorized();
  if (!userHasAdsPermission(user, "ads:campaigns:read")) {
    return apiForbidden("Missing ads:campaigns:read");
  }

  const { orderId } = await context.params;
  const advertiserId = new URL(request.url).searchParams.get("advertiserId");
  if (!advertiserId) return jsonError("advertiserId query required", 400);

  try {
    await requireAdvertiserAccess(user, advertiserId);
  } catch (err) {
    if (err instanceof OrganisationAccessError) {
      return apiForbidden(err.message);
    }
    throw err;
  }

  const order = await getPlacementOrderForAdvertiser(orderId, advertiserId);
  if (!order) return jsonError("Order not found", 404);

  return jsonOk({
    ...serializeOrder(order),
    asOf: order.lastReconciledAt?.toISOString() ?? order.updatedAt.toISOString(),
    submissions: order.submissions.map((s) => ({
      requestRef: s.requestRef,
      providerOrderId: s.providerOrderId,
      status: s.status,
      observedAt: s.observedAt.toISOString(),
    })),
  });
}
