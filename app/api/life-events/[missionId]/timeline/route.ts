import { requireContinuitySession, disabledIf } from "@/lib/continuity-os/api";
import { continuityOsErrorResponse } from "@/lib/continuity-os/errors";
import { isLifeEventsEnabled } from "@/lib/continuity-os/feature-flags";
import { getLifeEventMission } from "@/lib/continuity-os/missions/life-event-service";

type Params = { params: Promise<{ missionId: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const user = await requireContinuitySession();
    if (user instanceof Response) return user;
    const disabled = disabledIf(isLifeEventsEnabled(), "LIFE_EVENTS_DISABLED");
    if (disabled) return disabled;

    const { missionId } = await params;
    const { mission } = await getLifeEventMission(missionId, user.id);
    return Response.json({
      milestones: mission.milestones,
      note: "A model cannot declare milestone completion without evidence.",
    });
  } catch (error) {
    return continuityOsErrorResponse(error);
  }
}
