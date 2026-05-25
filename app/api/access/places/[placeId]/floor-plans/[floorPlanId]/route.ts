import {
  floorPlanAssetUrl,
  getFloorPlanForAuthoring,
  getPublishedFloorPlan,
  updateFloorPlan,
} from "@/lib/access-intelligence/floor-plan-service";
import { canManagePlaceFloorPlans } from "@/lib/access-intelligence/floor-plan-policy";
import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { updateFloorPlanSchema } from "@/lib/validation/access-floor-plan";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ placeId: string; floorPlanId: string }> },
) {
  const { placeId, floorPlanId } = await params;
  const floorPlan = await getPublishedFloorPlan({ placeId, floorPlanId });
  if (!floorPlan) return jsonError("Floor plan not found", 404);
  return jsonOk({
    floorPlan: { ...floorPlan, assetUrl: floorPlanAssetUrl(floorPlan) },
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ placeId: string; floorPlanId: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { placeId, floorPlanId } = await params;
  if (!(await canManagePlaceFloorPlans(user, placeId))) {
    return jsonError("Forbidden", 403);
  }

  let body: unknown;
  try {
    body = await parseJsonRequestBody(req);
  } catch (e) {
    const err = jsonBodyErrorResponse(e);
    return jsonError(err.message, err.status);
  }

  const parsed = updateFloorPlanSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const existing = await getFloorPlanForAuthoring({ placeId, floorPlanId });
  if (!existing) return jsonError("Floor plan not found", 404);

  const floorPlan = await updateFloorPlan({
    placeId,
    floorPlanId,
    actorId: user.id,
    data: parsed.data,
  });
  return jsonOk({
    floorPlan: { ...floorPlan, assetUrl: floorPlanAssetUrl(floorPlan) },
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ placeId: string; floorPlanId: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { placeId, floorPlanId } = await params;
  if (!(await canManagePlaceFloorPlans(user, placeId))) {
    return jsonError("Forbidden", 403);
  }

  const existing = await getFloorPlanForAuthoring({ placeId, floorPlanId });
  if (!existing) return jsonError("Floor plan not found", 404);

  const floorPlan = await updateFloorPlan({
    placeId,
    floorPlanId,
    actorId: user.id,
    data: { status: "archived" },
  });
  return jsonOk({ floorPlan: { id: floorPlan.id, status: floorPlan.status } });
}
