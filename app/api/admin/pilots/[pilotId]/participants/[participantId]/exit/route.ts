import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { zodErrorResponse } from "@/lib/api/response";
import { jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import {
  loadPilotScoped,
  mapPilotServiceError,
} from "@/lib/pilot/api/access";
import { exitPilotParticipant } from "@/lib/pilot/enrolment/participant-exit-service";

const bodySchema = z.object({
  reason: z.string().min(1).max(2000),
});

type Params = {
  params: Promise<{ pilotId: string; participantId: string }>;
};

/** POST /api/admin/pilots/[pilotId]/participants/[participantId]/exit */
export async function POST(req: Request, { params }: Params) {
  const user = await requireApiPermission("pilot:participant:enrol");
  if (user instanceof Response) return user;

  const { pilotId, participantId } = await params;
  const pilot = await loadPilotScoped(user, pilotId);
  if (pilot instanceof Response) return pilot;

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const enrolment = await exitPilotParticipant({
      pilotId,
      participantId,
      reason: parsed.data.reason,
      actorUserId: user.id,
    });
    return jsonNdisOk({
      enrolment: {
        id: enrolment.id,
        participantId: enrolment.participantId,
        status: enrolment.status,
        exitReason: enrolment.exitReason,
      },
    });
  } catch (e) {
    const mapped = mapPilotServiceError(e);
    if (mapped) return mapped;
    throw e;
  }
}
