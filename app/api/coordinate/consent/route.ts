import { jsonOk } from "@/lib/api/response";
import {
  handleCoordinateServiceError,
  requireCoordinateApiUser,
  resolveParticipantIdFromRequest,
} from "@/lib/coordinate/api-helpers";
import { getConsentGateState } from "@/lib/coordinate/consent-gate";
import { isCoordinatorRole } from "@/lib/coordinate/access-service";

export async function GET(req: Request) {
  const user = await requireCoordinateApiUser();
  if (user instanceof Response) return user;

  try {
    const participantId = resolveParticipantIdFromRequest(
      user,
      new URL(req.url).searchParams,
    );
    const coordinatorId = isCoordinatorRole(user.primaryRole)
      ? user.id
      : undefined;

    const state = await getConsentGateState({ participantId, coordinatorId });
    return jsonOk({ participantId, ...state });
  } catch (error) {
    return handleCoordinateServiceError(error);
  }
}
