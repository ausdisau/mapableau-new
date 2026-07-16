import { requireContinuitySession, disabledIf } from "@/lib/continuity-os/api";
import { continuityOsErrorResponse } from "@/lib/continuity-os/errors";
import { isRecoveryOptionsEnabled } from "@/lib/continuity-os/feature-flags";
import { getRecoveryCase } from "@/lib/continuity-os/recovery/case-service";

type Params = { params: Promise<{ recoveryId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireContinuitySession();
    if (user instanceof Response) return user;
    const disabled = disabledIf(
      isRecoveryOptionsEnabled(),
      "RECOVERY_OPTIONS_DISABLED"
    );
    if (disabled) return disabled;

    const { recoveryId } = await params;
    const recoveryCase = await getRecoveryCase(recoveryId, user.id);
    return Response.json({ recoveryCase });
  } catch (error) {
    return continuityOsErrorResponse(error);
  }
}
