import { prisma } from "@/lib/prisma";

export async function exitPilotParticipant(input: {
  pilotId: string;
  participantId: string;
  reason: string;
  actorUserId: string;
}) {
  return prisma.pilotParticipantEnrolment.update({
    where: {
      pilotId_participantId: {
        pilotId: input.pilotId,
        participantId: input.participantId,
      },
    },
    data: {
      status: "exited",
      exitReason: input.reason,
      exitedAt: new Date(),
      safeNotesJson: { exitedById: input.actorUserId },
    },
  });
}
