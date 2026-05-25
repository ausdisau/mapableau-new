import { jsonError, jsonOk } from "@/lib/api/response";
import { toPublicTrackingDTO } from "@/lib/foods/access-control";
import { getPublicFoodTracking } from "@/lib/foods/delivery-service";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const assignment = await getPublicFoodTracking(token);
  if (!assignment) return jsonError("Not found", 404);
  return jsonOk({ tracking: toPublicTrackingDTO(assignment), events: assignment.trackingEvents });
}