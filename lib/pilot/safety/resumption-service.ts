import { recordPilotDecision } from "@/lib/pilot/progression/pilot-decision-service";
import { canResumePilot } from "@/lib/pilot/safety/pause-policy";
import { prisma } from "@/lib/prisma";

export async function resumePilot(input: {
  pilotId: string;
  actorUserId: string;
  rationale: string;
}) {
  const pilot = await prisma.controlledPilot.findUniqueOrThrow({
    where: { id: input.pilotId },
  });
  if (!canResumePilot(pilot.status)) {
    throw new Error(`CANNOT_RESUME:${pilot.status}`);
  }
  if (pilot.resumeRequiresDecision && !input.rationale.trim()) {
    throw new Error("RESUME_REQUIRES_HUMAN_RATIONALE");
  }

  return recordPilotDecision({
    pilotId: input.pilotId,
    decision: "resume",
    decidedById: input.actorUserId,
    rationale: input.rationale,
    toStatus: "active",
  });
}
