import type { NdisAdapterType } from "@prisma/client";

import { getNdisAdapter, logNdisSyncEvent } from "@/lib/ndis/ndis-client";
import { prisma } from "@/lib/prisma";
import { remainingSystemsConfig } from "@/lib/config/remaining-systems";

export async function getActiveAdapterType(): Promise<NdisAdapterType> {
  const setting = await prisma.ndisIntegrationSetting.findFirst({
    where: { active: true },
    orderBy: { updatedAt: "desc" },
  });
  return setting?.adapterType ?? remainingSystemsConfig.ndisAdapterType;
}

export async function runAdapterHealthCheck() {
  const adapterType = await getActiveAdapterType();
  const adapter = getNdisAdapter(adapterType);
  const health = await adapter.getSyncHealth();

  await prisma.ndisAdapterHealthCheck.create({
    data: {
      adapterType,
      healthy: health.healthy,
      message: health.message,
    },
  });

  return health;
}

export async function callAdapter<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const adapterType = await getActiveAdapterType();
  const adapter = getNdisAdapter(adapterType);
  try {
    const result = await fn();
    await logNdisSyncEvent({
      adapterType: adapter.type,
      operation,
      status: "success",
    });
    return result;
  } catch (e) {
    await logNdisSyncEvent({
      adapterType: adapter.type,
      operation,
      status: "error",
      error: e instanceof Error ? e.message : String(e),
    });
    throw e;
  }
}

export async function ensureDefaultIntegrationSetting() {
  const existing = await prisma.ndisIntegrationSetting.findFirst();
  if (existing) return existing;
  return prisma.ndisIntegrationSetting.create({
    data: { adapterType: "mock", active: true },
  });
}
