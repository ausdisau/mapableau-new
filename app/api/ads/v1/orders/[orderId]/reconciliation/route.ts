import { userHasAdsPermission } from "@/lib/ads/auth/ads-permissions";
import { requireAdvertiserAccess } from "@/lib/ads/auth/advertiser-access";
import {
  assertPlacementApiEnabled,
  placementApiDisabledResponse,
} from "@/lib/ads/manager/flag-gate";
import {
  PlacementOrderError,
  reconcilePlacementOrder,
  serializeOrder,
} from "@/lib/ads/placement/orders";
import { OrganisationAccessError } from "@/lib/api/organisation-scope";
import { jsonError, jsonOk } from "@/lib/api/response";
import { apiForbidden, apiUnauthorized, getApiUser } from "@/lib/auth/guards";

type Ctx = { params: Promise<{ orderId: string }> };

/** GET /api/ads/v1/orders/{orderId}/reconciliation — reconcile-before-retry. */
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
    const result = await reconcilePlacementOrder(orderId, advertiserId);
    return jsonOk({
      order: serializeOrder(result.order),
      reconciliation: result.reconciliation,
      deliveryEvidence:
        "deliveryEvidence" in result.order
          ? (
              result.order as {
                deliveryEvidence: Array<{
                  metric: string;
                  value: number;
                  evidenceKind: string;
                  asOf: Date;
                }>;
              }
            ).deliveryEvidence.map((row) => ({
              metric: row.metric,
              value: row.value,
              evidenceKind: row.evidenceKind,
              asOf: row.asOf.toISOString(),
            }))
          : [],
      disputes:
        "disputes" in result.order
          ? (
              result.order as {
                disputes: Array<{ id: string; status: string; reason: string }>;
              }
            ).disputes
          : [],
    });
  } catch (err) {
    if (err instanceof OrganisationAccessError) {
      return apiForbidden(err.message);
    }
    if (err instanceof PlacementOrderError) {
      return jsonError(err.message, err.status);
    }
    throw err;
  }
}
