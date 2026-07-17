import { hasOutstandingPilotExposure } from "@/lib/pilot/closure/outstanding-transaction-service";
import { exitAllActiveParticipants } from "@/lib/pilot/closure/participant-exit";
import { recordPilotDecision } from "@/lib/pilot/progression/pilot-decision-service";
import { prisma } from "@/lib/prisma";

export async function closePilot(input: {
  pilotId: string;
  actorUserId: string;
  rationale: string;
  force?: boolean;
}) {
  const outstanding = await hasOutstandingPilotExposure(input.pilotId);
  if (outstanding && !input.force) {
    throw new Error("OUTSTANDING_RESERVATIONS_BLOCK_CLOSURE");
  }

  await exitAllActiveParticipants({
    pilotId: input.pilotId,
    actorUserId: input.actorUserId,
    reason: "pilot_closure",
  });

  await prisma.controlledPilot.update({
    where: { id: input.pilotId },
    data: { stage: "wind_down" },
  });

  return recordPilotDecision({
    pilotId: input.pilotId,
    decision: "close",
    decidedById: input.actorUserId,
    rationale: input.rationale,
    toStatus: "closed",
    toStage: "closed",
  });
}
