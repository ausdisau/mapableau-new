import { jsonOk } from "@/lib/api/response";
import { hasPermission } from "@/lib/auth/permissions";
import {
  handleCoordinateServiceError,
  requireCoordinateApiUser,
  resolveParticipantIdFromRequest,
} from "@/lib/coordinate/api-helpers";
import { updateHumanReviewTask } from "@/lib/coordinate/review-service";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const user = await requireCoordinateApiUser();
  if (user instanceof Response) return user;

  if (!hasPermission(user.primaryRole, "coordinate:review")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { taskId } = await params;
    const body = (await req.json()) as {
      participantId?: string;
      status?: "approved" | "rejected" | "in_progress" | "escalated";
      assigneeId?: string;
    };
    const participantId = resolveParticipantIdFromRequest(
      user,
      new URL(req.url).searchParams,
      body.participantId,
    );

    if (!body.status) {
      return Response.json({ error: "status is required" }, { status: 400 });
    }

    const task = await updateHumanReviewTask({
      actorId: user.id,
      actorRole: user.primaryRole,
      taskId,
      participantId,
      status: body.status,
      assigneeId: body.assigneeId,
    });
    return jsonOk({ task });
  } catch (error) {
    return handleCoordinateServiceError(error);
  }
}
