import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { zodErrorResponse } from "@/lib/api/response";
import { jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import {
  loadPilotScoped,
  mapPilotServiceError,
} from "@/lib/pilot/api/access";
import { enrolParticipantInPilot } from "@/lib/pilot/enrolment/participant-enrolment-service";

const bodySchema = z.object({
  participantActive: z.boolean().optional(),
  hasOrdinaryConsent: z.boolean().optional(),
});

type Params = {
  params: Promise<{ pilotId: string; participantId: string }>;
};

/** POST /api/admin/pilots/[pilotId]/participants/[participantId]/enrol */
export async function POST(req: Request, { params }: Params) {
  const user = await requireApiPermission("pilot:participant:enrol");
  if (user instanceof Response) return user;

  const { pilotId, participantId } = await params;
  const pilot = await loadPilotScoped(user, pilotId);
  if (pilot instanceof Response) return pilot;

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const enrolment = await enrolParticipantInPilot({
      pilotId,
      participantId,
      participantActive: parsed.data.participantActive,
      hasOrdinaryConsent: parsed.data.hasOrdinaryConsent,
    });
    return jsonNdisOk({
      enrolment: {
        id: enrolment.id,
        pilotId: enrolment.pilotId,
        participantId: enrolment.participantId,
        status: enrolment.status,
      },
      notice: "No AI enrolment. Explicit pilot consent required.",
    });
  } catch (e) {
    const mapped = mapPilotServiceError(e);
    if (mapped) return mapped;
    throw e;
  }
}
