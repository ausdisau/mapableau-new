import { requireAdvertiserAccess } from "@/lib/ads/auth/advertiser-access";
import { userHasAdsPermission } from "@/lib/ads/auth/ads-permissions";
import {
  assertPlacementApiEnabled,
  placementApiDisabledResponse,
} from "@/lib/ads/manager/flag-gate";
import { getPlacementOrderForAdvertiser } from "@/lib/ads/placement/orders";
import { OrganisationAccessError } from "@/lib/api/organisation-scope";
import { jsonError, jsonOk } from "@/lib/api/response";
import { apiForbidden, apiUnauthorized, getApiUser } from "@/lib/auth/guards";

type Ctx = { params: Promise<{ orderId: string }> };

/** GET /api/ads/v1/orders/{orderId}/delivery */
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
    orderId: order.id,
    evidence: order.deliveryEvidence.map((row) => ({
      source: row.source,
      evidenceKind: row.evidenceKind,
      metric: row.metric,
      value: row.value,
      unit: row.unit,
      asOf: row.asOf.toISOString(),
      licenceRef: row.licenceRef,
      notice:
        row.evidenceKind === "modelled_impressions"
          ? "Modelled estimate — not a verified unique viewer count"
          : undefined,
    })),
    freshness:
      order.deliveryEvidence[0]?.asOf.toISOString() ??
      order.lastReconciledAt?.toISOString() ??
      null,
  });
}
