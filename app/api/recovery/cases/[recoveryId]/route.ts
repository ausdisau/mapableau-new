import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { ContinuityFeatureDisabledError } from "@/lib/continuity-os/mission-extension-service";
import { getRecoveryCaseForParticipant } from "@/lib/continuity-os/recovery-case-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ recoveryId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { recoveryId } = await params;

  try {
    const recovery = await getRecoveryCaseForParticipant({
      recoveryId,
      participantId: user.id,
    });
    if (!recovery) return jsonError("Recovery case not found", 404);
    return jsonOk({
      recoveryId: recovery.id,
      missionId: recovery.missionId,
      status: recovery.status,
      playbookKey: recovery.playbookKey,
      shadowOnly: recovery.shadowOnly,
      selectedOptionId: recovery.selectedOptionId,
      options: recovery.optionsJson,
      proposal: recovery.proposalJson,
      ownerRole: recovery.ownerRole,
      outcome: recovery.outcome,
      failure: {
        id: recovery.failure.id,
        failureClass: recovery.failure.failureClass,
        severity: recovery.failure.severity,
        rawSummary: recovery.failure.rawSummary,
        verificationStatus: recovery.failure.verificationStatus,
        affectedDependencyId: recovery.failure.affectedDependencyId,
      },
      note: "A service failure is never represented as the participant's failure.",
    });
  } catch (e) {
    if (e instanceof ContinuityFeatureDisabledError) {
      return jsonError(e.message, 404);
    }
    throw e;
  }
}
