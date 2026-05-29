import { Prisma } from "@prisma/client";

import { phase5Config } from "@/lib/config/phase5";
import { phase8Config } from "@/lib/config/phase8";
import { prisma } from "@/lib/prisma";

function suppressMetric(n: number) {
  if (n > 0 && n < phase5Config.smallCellSuppressionThreshold) {
    return { suppressed: true, value: null };
  }
  return { suppressed: false, value: n };
}

export async function captureNationalInsightSnapshot(periodLabel: string) {
  if (!phase8Config.nationalInsightsEnabled) {
    throw new Error("NATIONAL_INSIGHTS_DISABLED");
  }

  const [careCompleted, transportCompleted, organisations, incidents] =
    await Promise.all([
      prisma.careShift.count({ where: { status: "completed" } }),
      prisma.transportBooking.count({ where: { status: "completed" } }),
      prisma.organisation.count(),
      prisma.incidentReport.count({
        where: { createdAt: { gte: new Date(Date.now() - 90 * 86400000) } },
      }),
    ]);

  const metrics = {
    careCompleted: suppressMetric(careCompleted),
    transportCompleted: suppressMetric(transportCompleted),
    providerCount: suppressMetric(organisations),
    incidents90d: suppressMetric(incidents),
    capturedAt: new Date().toISOString(),
    disclaimer: "Aggregate national metrics only — no participant-identifiable data.",
  };

  const anySuppressed = Object.values(metrics).some(
    (v) => typeof v === "object" && v !== null && "suppressed" in v && v.suppressed
  );

  return prisma.nationalInsightSnapshot.create({
    data: {
      periodLabel,
      metricsJson: metrics as Prisma.InputJsonValue,
      suppressed: anySuppressed,
      publishedAt: new Date(),
    },
  });
}

export async function listPublishedNationalInsights() {
  if (!phase8Config.nationalInsightsEnabled) return [];
  return prisma.nationalInsightSnapshot.findMany({
    where: { publishedAt: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 12,
    select: {
      id: true,
      periodLabel: true,
      metricsJson: true,
      suppressed: true,
      publishedAt: true,
    },
  });
}
