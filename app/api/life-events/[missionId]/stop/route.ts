import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk, zodErrorResponse } from "@/lib/api/response";
import { isLifeEventsEnabled } from "@/lib/continuity-os/config";
import { stopContinuityMission } from "@/lib/continuity-os/stop";

const bodySchema = z.object({
  reason: z.string().max(500).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ missionId: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!isLifeEventsEnabled()) return jsonError("Life events are disabled", 404);

  const { missionId } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const result = await stopContinuityMission({
      missionId,
      participantId: user.id,
      actorUserId: user.id,
      reason: parsed.data.reason,
    });
    return jsonOk(result);
  } catch (e) {
    if (e instanceof Error && e.message.includes("not found")) {
      return jsonError(e.message, 404);
    }
    throw e;
  }
}
