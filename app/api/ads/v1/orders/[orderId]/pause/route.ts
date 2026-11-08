import { z } from "zod";

import { userHasAdsPermission } from "@/lib/ads/auth/ads-permissions";
import { requireAdvertiserAccess } from "@/lib/ads/auth/advertiser-access";
import {
  assertPlacementApiEnabled,
  placementApiDisabledResponse,
} from "@/lib/ads/manager/flag-gate";
import {
  pausePlacementOrder,
  PlacementOrderError,
  serializeOrder,
} from "@/lib/ads/placement/orders";
import { OrganisationAccessError } from "@/lib/api/organisation-scope";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { apiForbidden, apiUnauthorized, getApiUser } from "@/lib/auth/guards";

type Ctx = { params: Promise<{ orderId: string }> };

const bodySchema = z.object({
  advertiserId: z.string().min(1),
});

/** POST /api/ads/v1/orders/{orderId}/pause */
export async function POST(request: Request, context: Ctx) {
  if (!assertPlacementApiEnabled()) return placementApiDisabledResponse();

  const user = await getApiUser();
  if (!user) return apiUnauthorized();
  if (!userHasAdsPermission(user, "ads:campaigns:write")) {
    return apiForbidden("Missing ads:campaigns:write");
  }

  const { orderId } = await context.params;
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    await requireAdvertiserAccess(user, parsed.data.advertiserId);
    const order = await pausePlacementOrder(orderId, parsed.data.advertiserId);
    return jsonOk({
      ...serializeOrder(order),
      notice: "Pause requested — provider confirmation may be pending",
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
