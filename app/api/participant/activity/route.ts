import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getParticipantActivityTimeline } from "@/lib/audit/domain-event-service";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  if (user.primaryRole !== "participant") {
    return jsonError("Forbidden", 403);
  }

  const events = await getParticipantActivityTimeline(user.id);
  return jsonOk({ events });
}
