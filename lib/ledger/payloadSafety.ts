const FORBIDDEN_PAYLOAD_KEY_PATTERN =
  /^(participantName|preferredName|fullName|ndisNumber|ndis|address|street|email|phone|mobile|caseNote|noteText|narrative|description)$/i;

function collectForbiddenKeys(
  value: unknown,
  path: string,
  found: string[]
): void {
  if (value === null || value === undefined) {
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      collectForbiddenKeys(item, `${path}[${index}]`, found)
    );
    return;
  }
  if (typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      if (FORBIDDEN_PAYLOAD_KEY_PATTERN.test(key)) {
        found.push(path ? `${path}.${key}` : key);
      }
      collectForbiddenKeys(
        nested,
        path ? `${path}.${key}` : key,
        found
      );
    }
  }
}

/**
 * Rejects ledger payloads that may contain PII. Ledger stores hashes only.
 */
export function assertLedgerPayloadSafe(payload: Record<string, unknown>): void {
  const forbidden: string[] = [];
  collectForbiddenKeys(payload, "", forbidden);
  if (forbidden.length > 0) {
    throw new Error(
      `Ledger payload must not contain private fields: ${forbidden.join(", ")}`
    );
  }
}
