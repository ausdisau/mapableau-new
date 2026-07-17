/**
 * Observability privacy — the observability pipeline MUST NOT log participant
 * NDIS numbers, complaint free text, or claim IDs. This helper strips known
 * risky keys from a payload before it hits any log sink.
 */

const REDACT_KEYS = new Set([
  "ndisNumber",
  "ndis_number",
  "complaintText",
  "complaint_body",
  "narrative",
  "rawClaimJson",
  "cardNumber",
  "cvv",
  "password",
  "authorization",
  "apiKey",
  "api_key",
]);

export function redactForLogging<T extends Record<string, unknown>>(input: T): T {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(input)) {
    if (REDACT_KEYS.has(key)) {
      out[key] = "[REDACTED]";
    } else {
      out[key] = input[key];
    }
  }
  return out as T;
}
