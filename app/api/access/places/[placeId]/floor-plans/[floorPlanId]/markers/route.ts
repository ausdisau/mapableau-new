import { createFloorPlanMarker } from "@/lib/access-intelligence/floor-plan-service";
import { canManagePlaceFloorPlans } from "@/lib/access-intelligence/floor-plan-policy";
import { requireApiSession } from "@/lib/api/auth-handler";
import {
  jsonBodyErrorResponse,
  parseJsonRequestBody,
} from "@/lib/api/request-body";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { createFloorPlanMarkerSchema } from "@/lib/validation/access-floor-plan";

export async function POST(
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

  const parsed = createFloorPlanMarkerSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const marker = await createFloorPlanMarker({
      placeId,
      floorPlanId,
      actorId: user.id,
      input: parsed.data,
    });
    return jsonOk({ marker }, 201);
  } catch (e) {
    if (e instanceof Error && e.message === "FLOOR_PLAN_NOT_FOUND") {
      return jsonError("Floor plan not found", 404);
    }
    throw e;
  }
}
