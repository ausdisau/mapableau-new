import { requireContinuitySession, disabledIf } from "@/lib/continuity-os/api";
import { continuityOsErrorResponse } from "@/lib/continuity-os/errors";
import { isRecoveryOptionsEnabled } from "@/lib/continuity-os/feature-flags";
import { prepareRecoveryProposal } from "@/lib/continuity-os/recovery/case-service";

type Params = { params: Promise<{ recoveryId: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const user = await requireContinuitySession();
    if (user instanceof Response) return user;
    const disabled = disabledIf(
      isRecoveryOptionsEnabled(),
      "RECOVERY_OPTIONS_DISABLED"
    );
    if (disabled) return disabled;

    const { recoveryId } = await params;
    const link = await prepareRecoveryProposal({
      recoveryId,
      participantId: user.id,
      actorUserId: user.id,
    });
    return Response.json({
      actionLink: link,
      states: {
        requestCreated: link.state.includes("prepared"),
        rideConfirmed: false,
        executed: false,
      },
    });
  } catch (error) {
    return continuityOsErrorResponse(error);
  }
}
