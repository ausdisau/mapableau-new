import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getParticipantContinuityTimeline } from "@/lib/orchestration/continuity-timeline-service";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  if (
    user.primaryRole !== "participant" &&
    user.primaryRole !== "support_coordinator" &&
    user.primaryRole !== "mapable_admin"
  ) {
    return jsonError("Forbidden", 403);
  }

  const participantId =
    user.primaryRole === "participant" ? user.id : user.id;

  const timeline = await getParticipantContinuityTimeline(participantId);
  return jsonOk({ timeline });
}
