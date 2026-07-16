import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { recordRecoveryOutcome } from "@/lib/continuity-os/recovery-case-service";

const schema = z.object({
  outcome: z.enum([
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
  postconditions: z.array(
    z.object({
      key: z.string(),
      passed: z.boolean(),
      evidence: z.string().optional(),
    })
  ),
  operatorAcknowledged: z.boolean().optional(),
  hardRequirementsMet: z.boolean().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ recoveryId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { recoveryId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const result = await recordRecoveryOutcome({
      recoveryId,
      participantId: user.id,
      actorUserId: user.id,
      outcome: parsed.data.outcome,
      postconditions: parsed.data.postconditions,
      operatorAcknowledged: parsed.data.operatorAcknowledged,
      hardRequirementsMet: parsed.data.hardRequirementsMet,
    });
    return jsonOk(result);
  } catch (e) {
    if (e instanceof Error) return jsonError(e.message, 400);
    throw e;
  }
}
