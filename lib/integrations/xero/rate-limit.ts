/** Simple per-tenant backoff tracker for Xero minute/day fairness. */

type Bucket = {
  minuteCount: number;
  minuteResetAt: number;
  dayCount: number;
  dayResetAt: number;
  cooldownUntil: number;
};

const buckets = new Map<string, Bucket>();

const MINUTE_LIMIT = 60;
const DAY_LIMIT = 5000;

export function noteXeroCall(tenantId: string, now = Date.now()): {
  allowed: boolean;
  retryAfterSeconds?: number;
} {
  const bucket = buckets.get(tenantId) ?? {
    minuteCount: 0,
    minuteResetAt: now + 60_000,
    dayCount: 0,
    dayResetAt: now + 86_400_000,
    cooldownUntil: 0,
  };

  if (now > bucket.minuteResetAt) {
    bucket.minuteCount = 0;
    bucket.minuteResetAt = now + 60_000;
  }
  if (now > bucket.dayResetAt) {
    bucket.dayCount = 0;
    bucket.dayResetAt = now + 86_400_000;
  }

  if (bucket.cooldownUntil > now) {
    buckets.set(tenantId, bucket);
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((bucket.cooldownUntil - now) / 1000),
    };
  }

  if (bucket.minuteCount >= MINUTE_LIMIT || bucket.dayCount >= DAY_LIMIT) {
    bucket.cooldownUntil = now + 60_000;
    buckets.set(tenantId, bucket);
    return { allowed: false, retryAfterSeconds: 60 };
  }

  bucket.minuteCount += 1;
  bucket.dayCount += 1;
  buckets.set(tenantId, bucket);
  return { allowed: true };
}

export function applyRetryAfter(tenantId: string, retryAfterSeconds: number) {
  const now = Date.now();
  const bucket = buckets.get(tenantId) ?? {
    minuteCount: 0,
    minuteResetAt: now + 60_000,
    dayCount: 0,
    dayResetAt: now + 86_400_000,
    cooldownUntil: 0,
  };
  bucket.cooldownUntil = now + Math.max(1, retryAfterSeconds) * 1000;
  buckets.set(tenantId, bucket);
}

/** Test helper */
export function resetXeroRateLimitBuckets() {
  buckets.clear();
}
