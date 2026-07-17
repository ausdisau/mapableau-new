import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { zodErrorResponse } from "@/lib/api/response";
import { jsonNdisError, jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import { mapPilotServiceError } from "@/lib/pilot/api/access";
import { recordPilotConsent } from "@/lib/pilot/enrolment/participant-consent-service";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  consentVersion: z.string().min(1).max(64),
});

type Params = { params: Promise<{ pilotId: string }> };

/** POST /api/participant/pilots/[pilotId]/consent */
export async function POST(req: Request, { params }: Params) {
  const user = await requireApiPermission("participant:pilot:consent");
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
    const updated = await recordPilotConsent({
      pilotId,
      participantId: user.id,
      actorUserId: user.id,
      consentVersion: parsed.data.consentVersion,
    });
    return jsonNdisOk({
      enrolment: {
        id: updated.id,
        status: updated.status,
        pilotConsentAt: updated.pilotConsentAt?.toISOString() ?? null,
      },
      notice:
        "Ordinary platform consent is not pilot consent. No AI approval is used.",
    });
  } catch (e) {
    const mapped = mapPilotServiceError(e);
    if (mapped) return mapped;
    throw e;
  }
}
