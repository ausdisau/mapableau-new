import type { PilotPauseReason } from "@prisma/client";

import { recordPilotDecision } from "@/lib/pilot/progression/pilot-decision-service";
import {
  assertPauseReason,
  canPausePilot,
} from "@/lib/pilot/safety/pause-policy";
import { prisma } from "@/lib/prisma";

export async function pausePilot(input: {
  pilotId: string;
  actorUserId: string;
  reason: PilotPauseReason;
  rationale: string;
}) {
  const pilot = await prisma.controlledPilot.findUniqueOrThrow({
    where: { id: input.pilotId },
  });
  if (!canPausePilot(pilot.status)) {
    throw new Error(`CANNOT_PAUSE:${pilot.status}`);
  }
  const reason = assertPauseReason(input.reason);

  await prisma.controlledPilot.update({
    where: { id: input.pilotId },
    data: {
      pauseReason: reason,
      pausedAt: new Date(),
      pausedById: input.actorUserId,
    },
  });

  return recordPilotDecision({
    pilotId: input.pilotId,
    decision: "pause",
    decidedById: input.actorUserId,
    rationale: input.rationale,
    toStatus: "paused",
  });
}
