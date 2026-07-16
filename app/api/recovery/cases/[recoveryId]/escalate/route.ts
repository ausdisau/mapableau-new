import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { escalateRecoveryCase } from "@/lib/continuity-os/recovery-case-service";

const schema = z.object({
  destinationRole: z.string().min(1),
  reason: z.string().min(1).max(2000),
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
    const escalation = await escalateRecoveryCase({
      recoveryId,
      participantId: user.id,
      actorUserId: user.id,
      destinationRole: parsed.data.destinationRole,
      reason: parsed.data.reason,
    });
    return jsonOk({
      escalationId: escalation.id,
      destinationRole: escalation.destinationRole,
      status: escalation.status,
      note: "Human assistance does not grant broad account access.",
    });
  } catch (e) {
    if (e instanceof Error) return jsonError(e.message, 400);
    throw e;
  }
}
