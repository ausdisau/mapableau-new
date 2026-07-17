import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { openRecoveryFromWorkerCancellation } from "@/lib/continuity/participant-recovery-service";
import { z } from "zod";

const bodySchema = z
  .object({
    careShiftId: z.string().min(1),
    reason: z.string().min(4).max(500),
    missionRef: z.string().max(200).optional(),
  })
  .strict();

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const recoveryCase = await openRecoveryFromWorkerCancellation({
      careShiftId: parsed.data.careShiftId,
      actor: user,
      reason: parsed.data.reason,
      missionRef: parsed.data.missionRef,
    });
    return jsonOk({ case: recoveryCase }, 201);
  } catch (e) {
    if (e instanceof Error && e.message === "FEATURE_DISABLED") {
      return jsonError("Continuity recovery is not enabled", 404);
    }
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return jsonError("Not found", 404);
    }
    return jsonError("Forbidden", 403);
  }
}
