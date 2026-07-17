import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { zodErrorResponse } from "@/lib/api/response";
import { jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import {
  getOptionalIdempotencyKey,
  loadPilotScoped,
  mapPilotServiceError,
} from "@/lib/pilot/api/access";
import { inviteParticipantToPilot } from "@/lib/pilot/enrolment/participant-enrolment-service";

const bodySchema = z.object({
  participantId: z.string().cuid(),
  delegateUserId: z.string().cuid().nullable().optional(),
});

type Params = { params: Promise<{ pilotId: string }> };

/** POST /api/admin/pilots/[pilotId]/participants/invite */
export async function POST(req: Request, { params }: Params) {
  const user = await requireApiPermission("pilot:participant:invite");
  if (user instanceof Response) return user;

  const { pilotId } = await params;
  const pilot = await loadPilotScoped(user, pilotId);
  if (pilot instanceof Response) return pilot;

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  // Optional Idempotency-Key accepted for clients; invite is unique on pilot+participant.
  void getOptionalIdempotencyKey(req);

  try {
    const enrolment = await inviteParticipantToPilot({
      pilotId,
      participantId: parsed.data.participantId,
      invitedById: user.id,
      delegateUserId: parsed.data.delegateUserId,
    });
    return jsonNdisOk(
      {
        enrolment: {
          id: enrolment.id,
          pilotId: enrolment.pilotId,
          participantId: enrolment.participantId,
          status: enrolment.status,
        },
      },
      201
    );
  } catch (e) {
    const mapped = mapPilotServiceError(e);
    if (mapped) return mapped;
    throw e;
  }
}
