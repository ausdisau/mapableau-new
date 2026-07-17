import { exitPilotParticipant } from "@/lib/pilot/enrolment/participant-exit-service";
import { prisma } from "@/lib/prisma";

export async function exitAllActiveParticipants(input: {
  pilotId: string;
  actorUserId: string;
  reason: string;
}) {
  const active = await prisma.pilotParticipantEnrolment.findMany({
    where: { pilotId: input.pilotId, status: "enrolled" },
  });
  const results = [];
  for (const e of active) {
    results.push(
      await exitPilotParticipant({
        pilotId: input.pilotId,
        participantId: e.participantId,
        reason: input.reason,
        actorUserId: input.actorUserId,
      })
    );
  }
  return results;
}
