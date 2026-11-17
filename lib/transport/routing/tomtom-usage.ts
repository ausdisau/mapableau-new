import { transportRoutingConfig } from "@/lib/config/transport-routing";
import { prisma } from "@/lib/prisma";

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

export async function tryReserveTomTomSlot(now = new Date()): Promise<boolean> {
  const cap = transportRoutingConfig.tomtomDailyRequestCap;
  if (cap <= 0) return false;
  const dayUtc = utcDayKey(now);

  const claimed = await prisma.transportRoutingDailyUsage.updateMany({
    where: {
      provider: TOMTOM_USAGE_PROVIDER,
      dayUtc,
      requestCount: { lt: cap },
    },
    data: { requestCount: { increment: 1 } },
  });
  if (claimed.count === 1) return true;

  try {
    await prisma.transportRoutingDailyUsage.create({
      data: {
        provider: TOMTOM_USAGE_PROVIDER,
        dayUtc,
        requestCount: 1,
      },
    });
    return true;
  } catch {
    const retried = await prisma.transportRoutingDailyUsage.updateMany({
      where: {
        provider: TOMTOM_USAGE_PROVIDER,
        dayUtc,
        requestCount: { lt: cap },
      },
      data: { requestCount: { increment: 1 } },
    });
    return retried.count === 1;
  }
}
