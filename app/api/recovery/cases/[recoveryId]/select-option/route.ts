import { z } from "zod";

import { requireContinuitySession, disabledIf } from "@/lib/continuity-os/api";
import {
  ContinuityOsError,
  continuityOsErrorResponse,
} from "@/lib/continuity-os/errors";
import { isRecoveryOptionsEnabled } from "@/lib/continuity-os/feature-flags";
import { selectRecoveryOption } from "@/lib/continuity-os/recovery/case-service";

type Params = { params: Promise<{ recoveryId: string }> };

const schema = z.object({
  optionId: z.string().min(1),
});

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireContinuitySession();
    if (user instanceof Response) return user;
    const disabled = disabledIf(
      isRecoveryOptionsEnabled(),
      "RECOVERY_OPTIONS_DISABLED"
    );
    if (disabled) return disabled;

    const { recoveryId } = await params;
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ContinuityOsError("VALIDATION_FAILED", "optionId required.", 400);
    }

    const result = await selectRecoveryOption({
      recoveryId,
      participantId: user.id,
      actorUserId: user.id,
      optionId: parsed.data.optionId,
    });
    return Response.json(result);
  } catch (error) {
    return continuityOsErrorResponse(error);
  }
}
