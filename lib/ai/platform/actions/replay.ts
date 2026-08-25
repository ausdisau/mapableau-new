const consumedNonces = new Set<string>();
const completedIdempotencyKeys = new Map<
  string,
  { resultId: string; completedAt: string }
>();

export function consumeNonce(nonce: string): boolean {
  if (consumedNonces.has(nonce)) return false;
  consumedNonces.add(nonce);
  return true;
}

export function isNonceConsumed(nonce: string): boolean {
  return consumedNonces.has(nonce);
}

export function claimIdempotencyKey(
  key: string,
): { claimed: true } | { claimed: false; existingResultId: string } {
  const existing = completedIdempotencyKeys.get(key);
  if (existing) {
    return { claimed: false, existingResultId: existing.resultId };
  }
  return { claimed: true };
}

export function recordIdempotentCompletion(
  key: string,
  resultId: string,
): void {
  completedIdempotencyKeys.set(key, {
    resultId,
    completedAt: new Date().toISOString(),
  });
}

export function getIdempotentResultId(key: string): string | null {
  return completedIdempotencyKeys.get(key)?.resultId ?? null;
}

/** Test helper */
export function clearReplayStore(): void {
  consumedNonces.clear();
  completedIdempotencyKeys.clear();
}
