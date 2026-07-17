import { redactNdisSensitiveFields } from "@/lib/crypto/ndis";

/**
 * Recursive sanitiser for logs, audit JSON, and error metadata.
 * Prefer this over ad-hoc redaction at call sites.
 */
export function sanitiseForLog<T>(value: T): T {
  return redactNdisSensitiveFields(value);
}

export function sanitiseAuditJson(
  value: Record<string, unknown> | null | undefined
): Record<string, unknown> | undefined {
  if (!value) return undefined;
  return sanitiseForLog(value);
}
