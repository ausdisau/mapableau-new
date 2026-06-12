import type { ApiScope } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const DEFAULT_REQUESTS_PER_MINUTE = 60;

export async function checkApiRateLimit(appId: string, scope?: ApiScope) {
  const rule = await prisma.apiRateLimitRule.findFirst({
    where: {
      active: true,
      OR: [{ scope }, { scope: null }],
    },
    orderBy: { scope: "desc" },
  });

  const limit = rule?.requestsPerMinute ?? DEFAULT_REQUESTS_PER_MINUTE;
  const since = new Date(Date.now() - 60_000);

  const recentCount = await prisma.apiUsageLog.count({
    where: {
      appId,
      createdAt: { gte: since },
    },
  });

  if (recentCount >= limit) {
    return {
      allowed: false as const,
      limit,
      retryAfterSeconds: 60,
    };
  }

  return { allowed: true as const, limit, remaining: limit - recentCount };
}
