import { z } from "zod";

import { requireContinuitySession, disabledIf } from "@/lib/continuity-os/api";
import {
  ContinuityOsError,
  continuityOsErrorResponse,
} from "@/lib/continuity-os/errors";
import { isLifeEventsEnabled } from "@/lib/continuity-os/feature-flags";
import {
  getLifeEventMission,
  updateLifeEventMission,
} from "@/lib/continuity-os/missions/life-event-service";

const patchSchema = z.object({
  participantGoal: z.string().optional(),
  participantWording: z.string().optional(),
  currentState: z.string().optional(),
  unknowns: z.array(z.string()).optional(),
  blockers: z.array(z.string()).optional(),
  desiredTiming: z.string().datetime().nullable().optional(),
  humanHelpRequested: z.boolean().optional(),
});

type Params = { params: Promise<{ missionId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireContinuitySession();
    if (user instanceof Response) return user;
    const disabled = disabledIf(isLifeEventsEnabled(), "LIFE_EVENTS_DISABLED");
    if (disabled) return disabled;

    const { missionId } = await params;
    const result = await getLifeEventMission(missionId, user.id);
    return Response.json(result);
  } catch (error) {
    return continuityOsErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await requireContinuitySession();
    if (user instanceof Response) return user;
    const disabled = disabledIf(isLifeEventsEnabled(), "LIFE_EVENTS_DISABLED");
    if (disabled) return disabled;

    const { missionId } = await params;
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      throw new ContinuityOsError("VALIDATION_FAILED", "Invalid patch.", 400);
    }

    const extension = await updateLifeEventMission({
      missionId,
      participantId: user.id,
      actorUserId: user.id,
      patch: {
        ...parsed.data,
        desiredTiming:
          parsed.data.desiredTiming === undefined
            ? undefined
            : parsed.data.desiredTiming
              ? new Date(parsed.data.desiredTiming)
              : null,
      },
    });

    return Response.json({ extension });
  } catch (error) {
    return continuityOsErrorResponse(error);
  }
}
