import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { zodErrorResponse } from "@/lib/api/response";
import { jsonNdisError, jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import { mapPilotServiceError } from "@/lib/pilot/api/access";
import { raisePilotSignal } from "@/lib/pilot/surveillance/signal-service";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  summary: z.string().min(1).max(2000),
  anonymous: z.boolean().optional().default(false),
});

type Params = { params: Promise<{ pilotId: string }> };

/**
 * POST /api/participant/pilots/[pilotId]/complaint
 * Raises a pilot safety signal. Linking to Complaint records is admin-managed.
 */
export async function POST(req: Request, { params }: Params) {
  const user = await requireApiPermission("participant:pilot:complaint");
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
    const signal = await raisePilotSignal({
      pilotId,
      signalType: "complaint",
      summary: parsed.data.summary,
      source: "participant_complaint",
      sourceRef: parsed.data.anonymous ? "anonymous" : user.id,
      safePayloadJson: {
        anonymous: parsed.data.anonymous,
      },
    });
    return jsonNdisOk(
      {
        receipt: {
          signalId: signal.id,
          anonymous: parsed.data.anonymous,
          notice:
            "Complaint recorded for pilot operators. Non-retaliation policy applies.",
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
