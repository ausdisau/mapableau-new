import { updateFloorPlan } from "@/lib/access-intelligence/floor-plan-service";
import { canManagePlaceFloorPlans } from "@/lib/access-intelligence/floor-plan-policy";
import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ placeId: string; floorPlanId: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { placeId, floorPlanId } = await params;
  if (!(await canManagePlaceFloorPlans(user, placeId))) {
    return jsonError("Forbidden", 403);
  }

  try {
    const floorPlan = await updateFloorPlan({
      placeId,
      floorPlanId,
      actorId: user.id,
      data: { status: "published" },
    });
    return jsonOk({
      floorPlan: { id: floorPlan.id, status: floorPlan.status },
    });
  } catch (e) {
    if (e instanceof Error && e.message === "FLOOR_PLAN_NOT_FOUND") {
      return jsonError("Floor plan not found", 404);
    }
    throw e;
  }
}
