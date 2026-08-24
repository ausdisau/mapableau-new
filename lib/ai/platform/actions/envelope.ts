import { createHash } from "node:crypto";

/**
 * Deterministic canonical payload hashing — key-order independent.
 * Reuses the CareOS envelope algorithm for cross-system consistency.
 */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function hashActionPayload(payload: unknown): string {
  return createHash("sha256").update(canonical(payload)).digest("hex");
}

export function hashInformationToShare(items: string[]): string {
  return hashActionPayload([...items].sort((a, b) => a.localeCompare(b)));
}

export function buildIdempotencyKey(input: {
  proposalId: string;
  approvalId: string;
  nonce: string;
}): string {
  return hashActionPayload({
    proposalId: input.proposalId,
    approvalId: input.approvalId,
    nonce: input.nonce,
  });
}
