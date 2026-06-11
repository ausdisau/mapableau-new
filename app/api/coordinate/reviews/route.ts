import { jsonOk } from "@/lib/api/response";
import { hasPermission } from "@/lib/auth/permissions";
import {
  handleCoordinateServiceError,
  requireCoordinateApiUser,
  resolveParticipantIdFromRequest,
} from "@/lib/coordinate/api-helpers";
import { listHumanReviewTasks } from "@/lib/coordinate/review-service";

export async function GET(req: Request) {
  const user = await requireCoordinateApiUser();
  if (user instanceof Response) return user;

  if (!hasPermission(user.primaryRole, "coordinate:review")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const participantIdParam = searchParams.get("participantId");
    const participantId = participantIdParam
      ? resolveParticipantIdFromRequest(user, searchParams)
      : undefined;

    const tasks = await listHumanReviewTasks({
      actorId: user.id,
      actorRole: user.primaryRole,
      participantId,
      status: ["open", "in_progress"],
    });
    return jsonOk({ tasks });
  } catch (error) {
    return handleCoordinateServiceError(error);
  }
}
