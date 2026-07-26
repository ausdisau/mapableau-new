/**
 * Process-local IP rate limit with optional Upstash Redis REST backend.
 *
 * NOT production-safe for multi-instance deployments unless Upstash env is
 * configured (`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`).
 * See docs/operations/RATE_LIMITING.md.
 */

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "anonymous"
  );
}

export type RateLimitOptions = {
  windowMs: number;
  max: number;
  /** Logical bucket key prefix (e.g. visit-plan-share). */
  prefix?: string;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** Unix epoch seconds when the window resets. */
  reset: number;
};

function memoryRateLimit(
  key: string,
  options: RateLimitOptions,
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || entry.resetAt < now) {
    const resetAt = now + options.windowMs;
    rateLimitMap.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      limit: options.max,
      remaining: Math.max(0, options.max - 1),
      reset: Math.ceil(resetAt / 1000),
    };
  }
  if (entry.count >= options.max) {
    return {
      allowed: false,
      limit: options.max,
      remaining: 0,
      reset: Math.ceil(entry.resetAt / 1000),
    };
  }
  entry.count += 1;
  return {
    allowed: true,
    limit: options.max,
    remaining: Math.max(0, options.max - entry.count),
    reset: Math.ceil(entry.resetAt / 1000),
  };
}

/**
 * Optional Upstash Redis REST fixed-window limiter.
 * Uses INCR + EXPIRE via the REST API — no SDK dependency (FEATURE_FREEZE-safe).
 */
async function upstashRateLimit(
  key: string,
  options: RateLimitOptions,
): Promise<RateLimitResult | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;

  const windowSec = Math.max(1, Math.ceil(options.windowMs / 1000));
  const redisKey = `rl:${options.prefix ?? "ip"}:${key}`;

  try {
    // Pipeline: INCR then EXPIRE NX (set TTL only on first hit).
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["EXPIRE", redisKey, windowSec, "NX"],
        ["TTL", redisKey],
      ]),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ result: number }>;
    const count = Number(data[0]?.result ?? 0);
    const ttl = Number(data[2]?.result ?? windowSec);
    const reset = Math.ceil(Date.now() / 1000) + Math.max(1, ttl);
    const allowed = count <= options.max;
    return {
      allowed,
      limit: options.max,
      remaining: Math.max(0, options.max - count),
      reset,
    };
  } catch {
    // Fail closed for sensitive enumeration endpoints when Upstash is configured
    // but unreachable — caller may choose; we return null to fall back to memory.
    return null;
  }
}

/** @returns true when the request is allowed; false when limited. */
export function checkIpRateLimit(
  ip: string,
  options: { windowMs: number; max: number },
): boolean {
  return memoryRateLimit(ip, options).allowed;
}

/**
 * Rate-limit with standard IETF RateLimit headers metadata.
 * Prefers Upstash when configured; otherwise process-local Map.
 */
export async function enforceIpRateLimit(
  ip: string,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const key = `${options.prefix ?? "ip"}:${ip}`;
  const distributed = await upstashRateLimit(key, options);
  if (distributed) return distributed;
  return memoryRateLimit(key, options);
}

/** Attach standard rate-limit response headers (draft-ietf-httpapi-ratelimit-headers). */
export function applyRateLimitHeaders(
  headers: Headers,
  result: RateLimitResult,
): void {
  headers.set("RateLimit-Limit", String(result.limit));
  headers.set("RateLimit-Remaining", String(result.remaining));
  headers.set("RateLimit-Reset", String(result.reset));
  headers.set("X-RateLimit-Limit", String(result.limit));
  headers.set("X-RateLimit-Remaining", String(result.remaining));
  headers.set("X-RateLimit-Reset", String(result.reset));
  if (!result.allowed) {
    const retryAfter = Math.max(1, result.reset - Math.ceil(Date.now() / 1000));
    headers.set("Retry-After", String(retryAfter));
  }
}
