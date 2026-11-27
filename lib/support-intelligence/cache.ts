type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const memory = new Map<string, CacheEntry<unknown>>();

/**
 * In-process TTL cache for Spider/REG responses. Values must be public or
 * already de-identified — never cache participant or worker private payloads.
 */
export function getCached<T>(key: string): T | null {
  const entry = memory.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    memory.delete(key);
    return null;
  }
  return entry.value as T;
}

export function setCached<T>(key: string, value: T, ttlMs: number): void {
  memory.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function clearSupportIntelligenceCache(): void {
  memory.clear();
}

export function cacheKey(parts: string[]): string {
  return parts.map((p) => p.replace(/\|/g, "_")).join("|");
}
