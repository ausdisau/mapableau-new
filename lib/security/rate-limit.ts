import type { Prisma } from "@prisma/client";

import { phase5Config } from "@/lib/config/phase5";
import { prisma } from "@/lib/prisma";

const buckets = new Map<string, { count: number; resetAt: number }>();

const DEFAULT_LIMIT = 60;
const DEFAULT_WINDOW_MS = 60_000;

export type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfterMs: number };

export function checkRateLimit(
  clientKey: string,
  route: string,
  limit = DEFAULT_LIMIT,
  windowMs = DEFAULT_WINDOW_MS
): RateLimitResult {
  if (!phase5Config.apiRateLimitingEnabled) {
    return { allowed: true, remaining: limit };
  }

  const key = `${clientKey}:${route}`;
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }

  return { allowed: true, remaining: limit - bucket.count };
}

export async function recordRateLimitEvent(clientKey: string, route: string) {
  await prisma.rateLimitEvent.create({
    data: { clientKey, route },
  });
}

export async function logSecurityEvent(params: {
  eventType: string;
  userId?: string;
  ipAddress?: string;
  route?: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.securityEvent.create({
    data: {
      eventType: params.eventType,
      userId: params.userId,
      ipAddress: params.ipAddress,
      route: params.route,
      metadata: (params.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function enforceRateLimit(
  clientKey: string,
  route: string,
  limit?: number
): Promise<RateLimitResult> {
  const result = checkRateLimit(clientKey, route, limit);
  if (!result.allowed) {
    await recordRateLimitEvent(clientKey, route);
    await logSecurityEvent({
      eventType: "rate_limit_exceeded",
      route,
      metadata: { clientKey: clientKey.slice(0, 8) + "…" },
    });
  }
  return result;
}
