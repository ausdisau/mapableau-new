/**
 * Contract & data ingestion shield for text before Prisma mutations.
 * Aborts unsafe payloads; callers should map failures to HTTP 422.
 */

export type PayloadSafeResult =
  | { ok: true; sanitized: string }
  | { ok: false; reason: string; code: "PAYLOAD_UNSAFE" };

const SQL_MANIPULATION: RegExp[] = [
  /\bunion\s+select\b/i,
  /\bdrop\s+table\b/i,
  /\binsert\s+into\b/i,
  /\bdelete\s+from\b/i,
  /\bupdate\s+\w+\s+set\b/i,
  /;\s*--/,
  /\/\*[\s\S]*?\*\//,
  /\bor\s+1\s*=\s*1\b/i,
  /\bexec(\s+|\s*\()\s*(xp_|sp_)/i,
];

/** Structural / health dump indicators (not ordinary product vocabulary alone). */
const SENSITIVE_DUMP_MARKERS: RegExp[] = [
  /\bmedicare\s*(card|number|#)\b/i,
  /\birn\s*[:=]?\s*\d{1,2}\b/i,
  /\bndis\s*(plan\s*)?(number|id)\s*[:=]?\s*[A-Z0-9-]{8,}\b/i,
  /\bclinical\s+(notes?|file|record|attachment)\b/i,
  /\bphi\s*[:=]/i,
  /\bssn\s*[:=]?\s*\d{3}-?\d{2}-?\d{4}\b/i,
  /\bpassport\s+number\s*[:=]/i,
  /-----BEGIN\s+(CERTIFICATE|PRIVATE\s+KEY|RSA\s+PRIVATE\s+KEY)-----/,
  /\bbase64[,:]\s*[A-Za-z0-9+/]{200,}={0,2}/,
];

const PROMPT_INJECTION: RegExp[] = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /system\s+override/i,
  /you\s+are\s+now\s+an?\s+admin/i,
  /disregard\s+(all\s+)?prior\s+(instructions|rules)/i,
];

const MAX_LENGTH = 20_000;

/**
 * Verify a free-text payload is safe to persist.
 * Strips nothing silently on failure — callers must abort the transaction.
 */
export function verifyPayloadSafe(
  input: string | null | undefined,
  options: { maxLength?: number; field?: string } = {},
): PayloadSafeResult {
  if (input == null) {
    return { ok: true, sanitized: "" };
  }
  if (typeof input !== "string") {
    return {
      ok: false,
      reason: "Payload must be a string",
      code: "PAYLOAD_UNSAFE",
    };
  }

  const maxLength = options.maxLength ?? MAX_LENGTH;
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { ok: true, sanitized: "" };
  }
  if (trimmed.length > maxLength) {
    return {
      ok: false,
      reason: `Payload exceeds maximum length (${maxLength})`,
      code: "PAYLOAD_UNSAFE",
    };
  }

  for (const re of SQL_MANIPULATION) {
    if (re.test(trimmed)) {
      return {
        ok: false,
        reason: "Payload contains database manipulation patterns",
        code: "PAYLOAD_UNSAFE",
      };
    }
  }

  for (const re of SENSITIVE_DUMP_MARKERS) {
    if (re.test(trimmed)) {
      return {
        ok: false,
        reason: "Payload appears to contain sensitive document or health dump content",
        code: "PAYLOAD_UNSAFE",
      };
    }
  }

  for (const re of PROMPT_INJECTION) {
    if (re.test(trimmed)) {
      return {
        ok: false,
        reason: "Payload contains prompt-injection patterns",
        code: "PAYLOAD_UNSAFE",
      };
    }
  }

  return { ok: true, sanitized: trimmed };
}

/**
 * Recursively scan string leaves in a JSON-like object.
 * Returns the first failure, or ok when all strings pass.
 */
export function verifyObjectPayloadSafe(
  value: unknown,
  options: { maxLength?: number } = {},
): PayloadSafeResult {
  if (typeof value === "string") {
    return verifyPayloadSafe(value, options);
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const result = verifyObjectPayloadSafe(item, options);
      if (!result.ok) return result;
    }
    return { ok: true, sanitized: "" };
  }
  if (value && typeof value === "object") {
    for (const nested of Object.values(value as Record<string, unknown>)) {
      const result = verifyObjectPayloadSafe(nested, options);
      if (!result.ok) return result;
    }
    return { ok: true, sanitized: "" };
  }
  return { ok: true, sanitized: "" };
}

export class UnsafePayloadError extends Error {
  readonly status = 422;
  readonly code = "PAYLOAD_UNSAFE" as const;

  constructor(message: string) {
    super(message);
    this.name = "UnsafePayloadError";
  }
}
