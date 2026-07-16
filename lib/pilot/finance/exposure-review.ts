import { loadPilotCounters } from "@/lib/pilot/limits/pilot-counter-store";
import { computeFinancialControl } from "@/lib/pilot/finance/pilot-financial-control";
import { prisma } from "@/lib/prisma";

export async function reviewPilotExposure(pilotId: string) {
  const pilot = await prisma.controlledPilot.findUniqueOrThrow({
    where: { id: pilotId },
  });
  const counters = await loadPilotCounters(pilotId, null);
  return {
    pilotId,
    counters,
    control: computeFinancialControl({
      maxTotalExposureCents: pilot.maxTotalExposureCents,
      maxDailyExposureCents: pilot.maxDailyExposureCents,
      reservedCents: counters.reservedCents,
      committedCents: counters.committedCents,
      dailyCommittedCents: counters.dailyCommittedCents,
    }),
  };
}
