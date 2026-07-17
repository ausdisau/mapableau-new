import { z } from "zod";

import { requireApiPermission } from "@/lib/api/auth-handler";
import { zodErrorResponse } from "@/lib/api/response";
import { jsonNdisError, jsonNdisOk } from "@/lib/ndis-gateway/security/http";
import { validatePilotFeedback } from "@/lib/pilot/outcomes/participant-feedback-service";
import { raisePilotSignal } from "@/lib/pilot/surveillance/signal-service";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  score: z.number().int().min(0).max(10),
  comment: z.string().max(4000).optional(),
});

type Params = { params: Promise<{ pilotId: string }> };

/** POST /api/participant/pilots/[pilotId]/feedback */
export async function POST(req: Request, { params }: Params) {
  const user = await requireApiPermission("participant:pilot:feedback");
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

  const check = validatePilotFeedback(parsed.data);
  if (!check.ok) {
    return jsonNdisError(check.errors.join(", "), 400);
  }

  const signal = await raisePilotSignal({
    pilotId,
    signalType: "other",
    summary: `Participant feedback score ${parsed.data.score}`,
    source: "participant_feedback",
    sourceRef: user.id,
    safePayloadJson: {
      score: parsed.data.score,
      comment: parsed.data.comment?.slice(0, 500) ?? null,
    },
  });

  return jsonNdisOk(
    {
      feedback: {
        score: parsed.data.score,
        submittedAt: new Date().toISOString(),
        signalId: signal.id,
      },
    },
    201
  );
}
