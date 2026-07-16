import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  ContinuityFeatureDisabledError,
  runResilienceForMission,
} from "@/lib/continuity-os/mission-extension-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ missionId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { missionId } = await params;

  try {
    const assessment = await runResilienceForMission({
      missionId,
      participantId: user.id,
      actorUserId: user.id,
    });
    return jsonOk({
      missionId,
      assessment,
      note: "No participant risk score is calculated. No live monitoring is started.",
    });
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
