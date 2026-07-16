import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { ContinuityFeatureDisabledError } from "@/lib/continuity-os/mission-extension-service";
import { transitionRecoveryHandoff } from "@/lib/continuity-os/recovery-case-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ handoffId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { handoffId } = await params;

  try {
    // Move through sent/received if needed is caller's responsibility; accept from received.
    const result = await transitionRecoveryHandoff({
      handoffId,
      participantId: user.id,
      actorUserId: user.id,
      toState: "accepted",
    });
    return jsonOk({
      ...result,
      note: "Accepted is not proof that every task was completed.",
    });
  } catch (e) {
    if (e instanceof ContinuityFeatureDisabledError) {
      return jsonError(e.message, 404);
    }
    if (e instanceof Error) return jsonError(e.message, 400);
    throw e;
  }
}
