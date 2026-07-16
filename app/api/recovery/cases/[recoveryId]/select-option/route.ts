import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { ContinuityFeatureDisabledError } from "@/lib/continuity-os/mission-extension-service";
import { selectRecoveryOption } from "@/lib/continuity-os/recovery-case-service";

const schema = z.object({ optionId: z.string().min(1) });

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
    const updated = await selectRecoveryOption({
      recoveryId,
      participantId: user.id,
      actorUserId: user.id,
      optionId: parsed.data.optionId,
    });
    return jsonOk({
      recoveryId: updated.id,
      selectedOptionId: updated.selectedOptionId,
      status: updated.status,
    });
  } catch (e) {
    if (e instanceof ContinuityFeatureDisabledError) {
      return jsonError(e.message, 404);
    }
    if (e instanceof Error) return jsonError(e.message, 400);
    throw e;
  }
}
