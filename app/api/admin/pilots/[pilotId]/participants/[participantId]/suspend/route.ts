import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { zodErrorResponse } from "@/lib/api/response";
import { jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import {
  loadPilotScoped,
  mapPilotServiceError,
} from "@/lib/pilot/api/access";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  reason: z.string().min(1).max(2000),
});

type Params = {
  params: Promise<{ pilotId: string; participantId: string }>;
};

/** POST /api/admin/pilots/[pilotId]/participants/[participantId]/suspend */
export async function POST(req: Request, { params }: Params) {
  const user = await requireApiPermission("pilot:participant:enrol");
  if (user instanceof Response) return user;

  const { pilotId, participantId } = await params;
  const pilot = await loadPilotScoped(user, pilotId);
  if (pilot instanceof Response) return pilot;

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return zodErrorResponse(parsed.error);

  try {
    const enrolment = await prisma.pilotParticipantEnrolment.update({
      where: {
        pilotId_participantId: { pilotId, participantId },
      },
      data: {
        status: "suspended",
        safeNotesJson: {
          suspendedById: user.id,
          reason: parsed.data.reason,
          suspendedAt: new Date().toISOString(),
        },
      },
    });
    return jsonNdisOk({
      enrolment: {
        id: enrolment.id,
        participantId: enrolment.participantId,
        status: enrolment.status,
      },
    });
  } catch (e) {
    const mapped = mapPilotServiceError(e);
    if (mapped) return mapped;
    throw e;
  }
}
