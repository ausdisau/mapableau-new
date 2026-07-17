import { createHash } from "node:crypto";

/**
 * Idempotency keys for AURA executions and step executions. The key MUST be
 * derived from stable inputs (plan id, step index, attempt, input hash, and a
 * caller-provided nonce) so that a retried call converges on the same key
 * rather than creating a duplicate side effect.
 */

export interface IdempotencyInputs {
  planId: string;
  stepIndex?: number;
  attempt?: number;
  inputHash: string;
  nonce?: string;
}

export function computeIdempotencyKey(input: IdempotencyInputs): string {
  const canonical = [
    input.planId,
    input.stepIndex ?? "root",
    input.attempt ?? 1,
    input.inputHash,
    input.nonce ?? "",
  ].join("::");
  return createHash("sha256").update(canonical).digest("hex");
}

export interface IdempotencyStore {
  get(key: string): Promise<{ createdAt: Date; snapshot: unknown } | null>;
  put(key: string, snapshot: unknown): Promise<void>;
}

export async function acquireIdempotency<T>(
  key: string,
  store: IdempotencyStore,
  produce: () => Promise<T>
): Promise<{ reused: boolean; value: T }> {
  const existing = await store.get(key);
  if (existing) {
    return { reused: true, value: existing.snapshot as T };
  }
  const value = await produce();
  await store.put(key, value);
  return { reused: false, value };
}
