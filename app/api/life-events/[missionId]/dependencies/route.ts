import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  ContinuityFeatureDisabledError,
  getDependencyProjectionForMission,
} from "@/lib/continuity-os/mission-extension-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ missionId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { missionId } = await params;

  try {
    const result = await getDependencyProjectionForMission({
      missionId,
      participantId: user.id,
    });
    return jsonOk(result);
  } catch (e) {
    if (e instanceof ContinuityFeatureDisabledError) {
      return jsonError(e.message, 404);
    }
    if (e instanceof Error && e.message.includes("not found")) {
      return jsonError(e.message, 404);
    }
    throw e;
  }
}
