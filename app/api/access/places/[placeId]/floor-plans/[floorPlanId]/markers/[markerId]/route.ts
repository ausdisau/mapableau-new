import {
  deleteFloorPlanMarker,
  updateFloorPlanMarker,
} from "@/lib/access-intelligence/floor-plan-service";
import { canManagePlaceFloorPlans } from "@/lib/access-intelligence/floor-plan-policy";
import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { updateFloorPlanMarkerSchema } from "@/lib/validation/access-floor-plan";

export async function PATCH(
  req: Request,
  {
    params,
  }: {
    params: Promise<{ placeId: string; floorPlanId: string; markerId: string }>;
  },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { placeId, floorPlanId, markerId } = await params;
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

  const parsed = updateFloorPlanMarkerSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const marker = await updateFloorPlanMarker({
      placeId,
      floorPlanId,
      markerId,
      input: parsed.data,
    });
    return jsonOk({ marker });
  } catch (e) {
    if (e instanceof Error && e.message.includes("FLOOR_PLAN")) {
      return jsonError("Marker not found", 404);
    }
    throw e;
  }
}

export async function DELETE(
  _req: Request,
  {
    params,
  }: {
    params: Promise<{ placeId: string; floorPlanId: string; markerId: string }>;
  },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { placeId, floorPlanId, markerId } = await params;
  if (!(await canManagePlaceFloorPlans(user, placeId))) {
    return jsonError("Forbidden", 403);
  }

  try {
    await deleteFloorPlanMarker({ placeId, floorPlanId, markerId });
    return jsonOk({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message.includes("FLOOR_PLAN")) {
      return jsonError("Marker not found", 404);
    }
    throw e;
  }
}
