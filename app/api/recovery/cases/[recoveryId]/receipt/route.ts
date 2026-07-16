import { requireContinuitySession, disabledIf } from "@/lib/continuity-os/api";
import { continuityOsErrorResponse } from "@/lib/continuity-os/errors";
import { isOutcomeVerificationEnabled } from "@/lib/continuity-os/feature-flags";
import { getRecoveryCase } from "@/lib/continuity-os/recovery/case-service";

type Params = { params: Promise<{ recoveryId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireContinuitySession();
    if (user instanceof Response) return user;
    const disabled = disabledIf(
      isOutcomeVerificationEnabled(),
      "OUTCOME_VERIFICATION_DISABLED"
    );
    if (disabled) return disabled;

    const { recoveryId } = await params;
    const recoveryCase = await getRecoveryCase(recoveryId, user.id);
    return Response.json({
      receipts: recoveryCase.receipts,
      note: "Receipts distinguish service action, real-world outcome, and goal achievement.",
    });
  } catch (error) {
    return continuityOsErrorResponse(error);
  }
}
