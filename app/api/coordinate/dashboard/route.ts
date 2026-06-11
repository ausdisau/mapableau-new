import { jsonOk } from "@/lib/api/response";
import {
  getCoordinateDashboard,
  listCoordinatorParticipantsForDashboard,
} from "@/lib/coordinate/plan-service";
import {
  handleCoordinateServiceError,
  requireCoordinateApiUser,
  resolveParticipantIdFromRequest,
} from "@/lib/coordinate/api-helpers";
import { isCoordinatorRole } from "@/lib/coordinate/access-service";

export async function GET(req: Request) {
  const user = await requireCoordinateApiUser();
  if (user instanceof Response) return user;

  try {
    const { searchParams } = new URL(req.url);
    const participantId = resolveParticipantIdFromRequest(user, searchParams);
    const dashboard = await getCoordinateDashboard({
      actorId: user.id,
      actorRole: user.primaryRole,
      participantId,
    });

    const coordinatorParticipants = isCoordinatorRole(user.primaryRole)
      ? await listCoordinatorParticipantsForDashboard(user.id)
      : [];

    return jsonOk({ dashboard, coordinatorParticipants });
  } catch (error) {
    return handleCoordinateServiceError(error);
  }
}
