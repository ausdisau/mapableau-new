import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { ContinuityFeatureDisabledError } from "@/lib/continuity-os/mission-extension-service";
import { prepareRecoveryProposal } from "@/lib/continuity-os/recovery-case-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ recoveryId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { recoveryId } = await params;

  try {
    const proposal = await prepareRecoveryProposal({
      recoveryId,
      participantId: user.id,
      actorUserId: user.id,
    });
    return jsonOk({
      proposal,
      note: "Proposal prepared only. Model cannot execute. Fresh participant approval required before any MapAble service write.",
    });
  } catch (e) {
    if (e instanceof ContinuityFeatureDisabledError) {
      return jsonError(e.message, 404);
    }
    if (e instanceof Error) return jsonError(e.message, 400);
    throw e;
  }
}
