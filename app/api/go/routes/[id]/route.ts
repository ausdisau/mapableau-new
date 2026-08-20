import { mapableGoFlags, goFeatureDisabledResponse } from "@/lib/config/mapable-go";
import { getRoutePlanForUser, selectRouteOption } from "@/lib/go/route-service";
import { getPlaceById } from "@/lib/access/map/access-place-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import type { PlanRouteResponse } from "@/lib/go/contracts/route-contracts";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!mapableGoFlags.participantRoutesEnabled) {
    return goFeatureDisabledResponse("MAPABLE_GO_ENABLED");
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await ctx.params;
  const plan = await getRoutePlanForUser(id, user.id);
  if (!plan) return jsonError("Route plan not found", 404);

  let destination = null;
  if (plan.destinationPlaceId) {
    const place = await getPlaceById(plan.destinationPlaceId);
    if (place) {
      destination = {
        id: place.id,
        name: place.name,
        suburb: place.suburb,
        features: place.features.map((f) => f.type),
        confidence: place.confidence,
      };
    }
  }

  return jsonOk({
    planId: plan.id,
    status: plan.status,
    selectedRouteId: plan.selectedRouteId,
    ...(plan.routePayload as PlanRouteResponse),
    destination,
  });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!mapableGoFlags.participantRoutesEnabled) {
    return goFeatureDisabledResponse("MAPABLE_GO_ENABLED");
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await ctx.params;
  const body = (await req.json()) as { selectedRouteId?: string };
  if (!body.selectedRouteId) return jsonError("selectedRouteId required", 400);

  const updated = await selectRouteOption({
    planId: id,
    userId: user.id,
    routeId: body.selectedRouteId,
  });
  if (!updated) return jsonError("Route plan not found", 404);

  return jsonOk({ planId: updated.id, selectedRouteId: updated.selectedRouteId });
}
