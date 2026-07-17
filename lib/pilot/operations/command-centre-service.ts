import { buildPilotActionQueue } from "@/lib/pilot/operations/action-queue";
import { buildOperationalSnapshot } from "@/lib/pilot/operations/operational-snapshot";
import { listActiveOperators } from "@/lib/pilot/operations/operator-roster";
import { prisma } from "@/lib/prisma";

export async function getPilotCommandCentre(pilotId: string) {
  const [pilot, snapshot, queue, operators, latestHandover] = await Promise.all([
    prisma.controlledPilot.findUniqueOrThrow({ where: { id: pilotId } }),
    buildOperationalSnapshot(pilotId),
    buildPilotActionQueue(pilotId),
    listActiveOperators(pilotId),
    prisma.pilotHandoverRecord.findFirst({
      where: { pilotId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    pilot: {
      id: pilot.id,
      name: pilot.name,
      code: pilot.code,
      status: pilot.status,
      stage: pilot.stage,
      limitedLiveEnabled: pilot.limitedLiveEnabled,
      pauseReason: pilot.pauseReason,
    },
    snapshot,
    queue,
    operators,
    latestHandover,
  };
}
