import type { ApiScope } from "@prisma/client";

import { recordUsageEvent } from "@/lib/usage/usage-ledger";

import { logApiUsage } from "./api-key-service";
import { checkApiRateLimit } from "./rate-limit-service";

export type ApiUsageContext = {
  appId: string;
  path: string;
  method: string;
  scopes: ApiScope[];
};

export async function enforceApiRateLimit(ctx: ApiUsageContext) {
  const primaryScope = ctx.scopes[0];
  const result = await checkApiRateLimit(ctx.appId, primaryScope);
  if (!result.allowed) {
    return {
      allowed: false as const,
      retryAfterSeconds: result.retryAfterSeconds,
    };
  }
  return { allowed: true as const };
}

export async function recordApiCall(params: {
  appId: string;
  path: string;
  method: string;
  status: number;
  organisationId?: string;
}) {
  await Promise.all([
    logApiUsage({
      appId: params.appId,
      path: params.path,
      method: params.method,
      status: params.status,
    }),
    recordUsageEvent({
      category: "api_call",
      eventType: "developer_api.request",
      developerAppId: params.appId,
      organisationId: params.organisationId,
      metadata: {
        path: params.path,
        method: params.method,
        status: params.status,
      },
    }),
  ]);
}
