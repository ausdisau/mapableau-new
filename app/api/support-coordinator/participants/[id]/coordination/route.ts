import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { CareSupportAccessError } from "@/lib/care-support/access-control";
import { getCoordinationTimeline } from "@/lib/care-support/coordination-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const user = await requireApiPermission("coordinator:portal");
  if (user instanceof Response) return user;

  const { id: participantId } = await context.params;

  try {
    const timeline = await getCoordinationTimeline(user.id, participantId);
    return jsonOk(timeline);
  } catch (e) {
    if (e instanceof CareSupportAccessError) return jsonError(e.message, 403);
    return jsonError("Failed to load coordination", 500);
  }
}
