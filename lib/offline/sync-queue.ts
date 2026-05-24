import { createHash } from "crypto";

import { prisma } from "@/lib/prisma";
import { remainingSystemsConfig } from "@/lib/config/remaining-systems";

const SENSITIVE_KEYS = ["ndis", "address", "medical", "password", "secret"];

export function sanitizeOfflinePayload(
  payload: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (SENSITIVE_KEYS.some((s) => key.toLowerCase().includes(s))) continue;
    out[key] = value;
  }
  return out;
}

export function hashOfflinePayload(payload: unknown): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export async function enqueueOfflineAction(params: {
  userId: string;
  actionType: string;
  payload: Record<string, unknown>;
}) {
  if (!remainingSystemsConfig.offlineModeEnabled) {
    throw new Error("OFFLINE_DISABLED");
  }

  const safe = sanitizeOfflinePayload(params.payload);
  return prisma.offlineSyncEvent.create({
    data: {
      userId: params.userId,
      actionType: params.actionType,
      payloadHash: hashOfflinePayload(safe),
      status: "queued",
    },
  });
}

export async function flushSyncQueue(userId: string) {
  const queued = await prisma.offlineSyncEvent.findMany({
    where: { userId, status: "queued" },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  for (const item of queued) {
    await prisma.offlineSyncEvent.update({
      where: { id: item.id },
      data: { status: "synced", syncedAt: new Date() },
    });
  }

  return { flushed: queued.length };
}
