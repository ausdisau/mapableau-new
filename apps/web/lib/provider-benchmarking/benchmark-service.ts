import { phase5Config } from "@/lib/config/phase5";
import { prisma } from "@/lib/prisma";

export async function captureProviderBenchmark(params: {
  organisationId?: string;
  metricKey: string;
  value: number;
  cohortSize: number;
  periodLabel: string;
}) {
  const suppressed =
    params.cohortSize > 0 &&
    params.cohortSize < phase5Config.smallCellSuppressionThreshold;

  return prisma.providerBenchmarkSnapshot.create({
    data: {
      organisationId: params.organisationId,
      metricKey: params.metricKey,
      value: suppressed ? null : params.value,
      cohortSize: params.cohortSize,
      suppressed,
      periodLabel: params.periodLabel,
    },
  });
}

export async function getProviderBenchmarkDashboard(organisationId?: string) {
  const snapshots = await prisma.providerBenchmarkSnapshot.findMany({
    where: organisationId ? { organisationId } : {},
    orderBy: { createdAt: "desc" },
    take: 40,
  });
  return {
    snapshots: snapshots.map((s) => ({
      ...s,
      displayValue: s.suppressed ? null : s.value,
    })),
    disclaimer:
      "Benchmarks are aggregate and may be suppressed for small cohorts — not rankings.",
  };
}
