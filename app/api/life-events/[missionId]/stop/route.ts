import { z } from "zod";

import { requireContinuitySession, disabledIf } from "@/lib/continuity-os/api";
import {
  ContinuityOsError,
  continuityOsErrorResponse,
} from "@/lib/continuity-os/errors";
import { isLifeEventsEnabled } from "@/lib/continuity-os/feature-flags";
import { stopLifeEventMission } from "@/lib/continuity-os/missions/life-event-service";

type Params = { params: Promise<{ missionId: string }> };

const bodySchema = z.object({
  reason: z.string().optional(),
});

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requireContinuitySession();
    if (user instanceof Response) return user;
    const disabled = disabledIf(isLifeEventsEnabled(), "LIFE_EVENTS_DISABLED");
    if (disabled) return disabled;

    const { missionId } = await params;
    const body = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      throw new ContinuityOsError("VALIDATION_FAILED", "Invalid stop payload.", 400);
    }

    const mission = await stopLifeEventMission({
      missionId,
      participantId: user.id,
      actorUserId: user.id,
      reason: parsed.data.reason,
    });

    return Response.json({ mission, stopped: true });
  } catch (error) {
    return continuityOsErrorResponse(error);
  }
}
