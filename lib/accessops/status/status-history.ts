import type { AccessStatusEvent } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function listStatusHistory(
  assetId: string,
  options: { limit?: number; since?: Date } = {},
): Promise<AccessStatusEvent[]> {
  return prisma.accessStatusEvent.findMany({
    where: {
      assetId,
      ...(options.since ? { effectiveFrom: { gte: options.since } } : {}),
    },
    orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }],
    take: Math.min(Math.max(options.limit ?? 50, 1), 200),
  });
}
