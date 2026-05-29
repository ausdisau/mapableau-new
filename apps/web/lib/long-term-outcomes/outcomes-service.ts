import { phase5Config } from "@/lib/config/phase5";
import { phase9Config } from "@/lib/config/phase9";
import { prisma } from "@/lib/prisma";

export async function publishLongTermOutcome(params: {
  periodLabel: string;
  outcomeKey: string;
  value: number;
  cohortSize: number;
  narrative?: string;
}) {
  if (!phase9Config.longitudinalImpactEnabled) {
    throw new Error("OUTCOMES_DISABLED");
  }

  const suppressed =
    params.cohortSize > 0 &&
    params.cohortSize < phase5Config.smallCellSuppressionThreshold;

  return prisma.longTermOutcomeSnapshot.create({
    data: {
      periodLabel: params.periodLabel,
      outcomeKey: params.outcomeKey,
      value: suppressed ? null : params.value,
      suppressed,
      narrative: params.narrative,
      publishedAt: new Date(),
    },
  });
}

export async function listPublishedOutcomes() {
  return prisma.longTermOutcomeSnapshot.findMany({
    where: { publishedAt: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
}
