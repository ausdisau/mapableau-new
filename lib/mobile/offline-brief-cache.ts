import type { WorkerShiftBriefContract } from "@/mobile-contracts/schemas/worker-shift-brief";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export function isBriefCacheStale(cachedAt: string | undefined) {
  if (!cachedAt) return true;
  const age = Date.now() - new Date(cachedAt).getTime();
  return age > CACHE_TTL_MS;
}

export function annotateBriefForCache(
  brief: Omit<WorkerShiftBriefContract, "cachedAt">
): WorkerShiftBriefContract {
  return {
    ...brief,
    cachedAt: new Date().toISOString(),
  };
}

export function validateBriefSyncPayload(body: unknown): {
  valid: boolean;
  cachedAt?: string;
  shiftId?: string;
} {
  if (!body || typeof body !== "object") return { valid: false };
  const record = body as Record<string, unknown>;
  if (typeof record.shiftId !== "string") return { valid: false };
  if (typeof record.cachedAt !== "string") return { valid: false };
  return {
    valid: true,
    shiftId: record.shiftId,
    cachedAt: record.cachedAt,
  };
}
