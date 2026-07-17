import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { zodErrorResponse } from "@/lib/api/response";
import { jsonNdisError, jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import { createAccessibilitySupportRequest } from "@/lib/pilot/accessibility/support-request-service";
import { raisePilotSignal } from "@/lib/pilot/surveillance/signal-service";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  need: z.string().min(1).max(2000),
});

type Params = { params: Promise<{ pilotId: string }> };

/** POST /api/participant/pilots/[pilotId]/support-request */
export async function POST(req: Request, { params }: Params) {
  const user = await requireApiPermission("participant:pilot:view");
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

  const request = createAccessibilitySupportRequest({
    pilotId,
    participantId: user.id,
    need: parsed.data.need,
  });

  const signal = await raisePilotSignal({
    pilotId,
    signalType: "accessibility",
    summary: `Accessibility support request: ${parsed.data.need.slice(0, 120)}`,
    source: "accessibility_support",
    sourceRef: user.id,
  });

  return jsonNdisOk(
    {
      supportRequest: request,
      signalId: signal.id,
    },
    201
  );
}
