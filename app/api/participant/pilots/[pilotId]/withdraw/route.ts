import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { zodErrorResponse } from "@/lib/api/response";
import { jsonNdisError, jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import { mapPilotServiceError } from "@/lib/pilot/api/access";
import { withdrawPilotConsent } from "@/lib/pilot/enrolment/participant-consent-service";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  reason: z.string().max(2000).optional(),
});

type Params = { params: Promise<{ pilotId: string }> };

/** POST /api/participant/pilots/[pilotId]/withdraw */
export async function POST(req: Request, { params }: Params) {
  const user = await requireApiPermission("participant:pilot:withdraw");
  if (user instanceof Response) return user;

  const { pilotId } = await params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const enrolment = await prisma.pilotParticipantEnrolment.findUnique({
    where: {
      pilotId_participantId: { pilotId, participantId: user.id },
    },
  });
  if (!enrolment) return jsonNdisError("Pilot not found", 404);

  try {
    const updated = await withdrawPilotConsent({
      pilotId,
      participantId: user.id,
      actorUserId: user.id,
      reason: parsed.data.reason,
    });
    return jsonNdisOk({
      enrolment: {
        id: updated.id,
        status: updated.status,
        withdrawnAt: updated.withdrawnAt?.toISOString() ?? null,
      },
    });
  } catch (e) {
    const mapped = mapPilotServiceError(e);
    if (mapped) return mapped;
    throw e;
  }
}
