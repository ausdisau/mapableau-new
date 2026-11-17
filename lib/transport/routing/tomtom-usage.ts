import { prisma } from "@/lib/prisma";
import { transportRoutingConfig } from "@/lib/config/transport-routing";

export const TOMTOM_USAGE_PROVIDER = "tomtom";

export function utcDayKey(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export async function getTomTomDailyUsage(now = new Date()): Promise<number> {
  const row = await prisma.transportRoutingDailyUsage.findUnique({
    where: {
      provider_dayUtc: {
        provider: TOMTOM_USAGE_PROVIDER,
        dayUtc: utcDayKey(now),
      },
    },
  });
  return row?.requestCount ?? 0;
}

export async function isTomTomDailyCapReached(now = new Date()): Promise<boolean> {
  const used = await getTomTomDailyUsage(now);
  return used >= transportRoutingConfig.tomtomDailyRequestCap;
}

export async function incrementTomTomUsage(now = new Date()): Promise<number> {
  const dayUtc = utcDayKey(now);
  const row = await prisma.transportRoutingDailyUsage.upsert({
    where: {
      provider_dayUtc: { provider: TOMTOM_USAGE_PROVIDER, dayUtc },
    },
    create: {
      provider: TOMTOM_USAGE_PROVIDER,
      dayUtc,
      requestCount: 1,
    },
    update: { requestCount: { increment: 1 } },
  });
  return row.requestCount;
}
