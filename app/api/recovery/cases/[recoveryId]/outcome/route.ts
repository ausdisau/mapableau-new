import { z } from "zod";

import { requireContinuitySession, disabledIf } from "@/lib/continuity-os/api";
import {
  ContinuityOsError,
  continuityOsErrorResponse,
} from "@/lib/continuity-os/errors";
import { isOutcomeVerificationEnabled } from "@/lib/continuity-os/feature-flags";
import { recordRecoveryOutcome } from "@/lib/continuity-os/recovery/case-service";

type Params = { params: Promise<{ recoveryId: string }> };

const schema = z.object({
  state: z.enum([
    "not_started",
    "pending",
    "partially_restored",
    "restored_with_conditions",
    "restored",
    "alternative_goal_completed",
    "not_restored",
    "cancelled_by_participant",
    "human_review_required",
    "outcome_unknown",
  ]),
  summary: z.string().min(1),
  falseRecovery: z.boolean().optional(),
  evidence: z.array(z.unknown()).optional(),
});

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireContinuitySession();
    if (user instanceof Response) return user;
    const disabled = disabledIf(
      isOutcomeVerificationEnabled(),
      "OUTCOME_VERIFICATION_DISABLED"
    );
    if (disabled) return disabled;

    const { recoveryId } = await params;
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ContinuityOsError("VALIDATION_FAILED", "Invalid outcome.", 400);
    }

    const result = await recordRecoveryOutcome({
      recoveryId,
      participantId: user.id,
      actorUserId: user.id,
      ...parsed.data,
    });
    return Response.json(result, { status: 201 });
  } catch (error) {
    return continuityOsErrorResponse(error);
  }
}
