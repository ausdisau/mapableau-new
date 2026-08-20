/**
 * First-party impression dedupe (in-process).
 * External providers own their own impression accounting.
 */

const seen = new Map<string, number>();
const TTL_MS = 60_000;

export function shouldRecordFirstPartyImpression(
  key: string,
  now = Date.now(),
): boolean {
  const prev = seen.get(key);
  if (prev != null && now - prev < TTL_MS) {
    return false;
  }
  seen.set(key, now);
  // Opportunistic cleanup
  if (seen.size > 5000) {
    for (const [k, t] of seen) {
      if (now - t >= TTL_MS) seen.delete(k);
    }
  }
  return true;
}

/** Test helper */
export function clearImpressionDedupe(): void {
  seen.clear();
}
