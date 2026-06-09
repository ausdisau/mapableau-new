import { phase5Config } from "@/lib/config/phase5";
import { logApiUsage } from "@/lib/developer-api/api-key-service";
import { prisma } from "@/lib/prisma";

export type ApiUsageMeteringConfig = {
  enabled: boolean;
  stripeMeterEventName: string | undefined;
  includedCallsPerMonth: number;
};

export const apiUsageMeteringConfig: ApiUsageMeteringConfig = {
  enabled: process.env.DEVELOPER_API_METERING_ENABLED === "true",
  stripeMeterEventName: process.env.STRIPE_API_USAGE_METER_EVENT,
  includedCallsPerMonth: Number(
    process.env.DEVELOPER_API_INCLUDED_CALLS ?? "10000"
  ),
};

export async function recordApiUsage(params: {
  appId: string;
  path: string;
  method: string;
  status: number;
}) {
  if (!phase5Config.developerApiEnabled) return { logged: false };

  await logApiUsage(params);

  if (!apiUsageMeteringConfig.enabled) {
    return { logged: true, metered: false };
  }

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const usageCount = await prisma.apiUsageLog.count({
    where: {
      appId: params.appId,
      createdAt: { gte: monthStart },
    },
  });

  const billable = Math.max(
    0,
    usageCount - apiUsageMeteringConfig.includedCallsPerMonth
  );

  return {
    logged: true,
    metered: true,
    usageCount,
    billableCalls: billable,
    stripeMeterEventName: apiUsageMeteringConfig.stripeMeterEventName,
  };
}

export async function getAppUsageSummary(appId: string, days = 30) {
  const since = new Date(Date.now() - days * 86400000);
  const [total, byPath] = await Promise.all([
    prisma.apiUsageLog.count({ where: { appId, createdAt: { gte: since } } }),
    prisma.apiUsageLog.groupBy({
      by: ["path"],
      where: { appId, createdAt: { gte: since } },
      _count: { path: true },
    }),
  ]);

  return {
    appId,
    periodDays: days,
    totalCalls: total,
    byPath: byPath.map((row) => ({
      path: row.path,
      count: row._count.path,
    })),
    includedCallsPerMonth: apiUsageMeteringConfig.includedCallsPerMonth,
  };
}
