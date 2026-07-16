import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { ContinuityFeatureDisabledError } from "@/lib/continuity-os/mission-extension-service";
import { getRecoveryCaseForParticipant } from "@/lib/continuity-os/recovery-case-service";
import { compareRecoveryOptions } from "@/lib/continuity-os/recovery-options";
import type { RecoveryOptionView } from "@/lib/continuity-os/types";

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
    const options =
      (recovery.optionsJson as unknown as RecoveryOptionView[]) ?? [];
    return jsonOk({
      recoveryId,
      options,
      comparison: compareRecoveryOptions(options),
      criticalTerms: [
        "failed",
        "unknown",
        "replacement",
        "cost",
        "approve",
        "decline",
        "cancel",
        "contact",
        "complaint",
        "stop",
        "emergency",
      ],
    });
  } catch (e) {
    if (e instanceof ContinuityFeatureDisabledError) {
      return jsonError(e.message, 404);
    }
    throw e;
  }
}
