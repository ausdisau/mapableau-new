import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "crypto";

const ALGORITHM = "aes-256-gcm" as const;
const ENVELOPE_VERSION = 1 as const;
const LEGACY_DELIMITER = ":";

export type NdisCryptoErrorCode =
  | "NDIS_ENCRYPTION_KEY_MISSING"
  | "NDIS_ENCRYPTION_KEY_VERSION_UNAVAILABLE"
  | "NDIS_CIPHERTEXT_MALFORMED"
  | "NDIS_DECRYPTION_FAILED";

export class NdisCryptoError extends Error {
  readonly code: NdisCryptoErrorCode;

  constructor(code: NdisCryptoErrorCode, message: string) {
    super(message);
    this.name = "NdisCryptoError";
    this.code = code;
  }
}

export type NdisEncryptedEnvelope = {
  version: typeof ENVELOPE_VERSION;
  keyVersion: string;
  algorithm: typeof ALGORITHM;
  iv: string;
  authTag: string;
  ciphertext: string;
};

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function activeKeyVersion(): string {
  return process.env.NDIS_ENCRYPTION_ACTIVE_KEY_VERSION?.trim() || "v1";
}

function resolveKeyMaterial(keyVersion: string): string {
  const envName = `NDIS_ENCRYPTION_KEY_${keyVersion.toUpperCase()}`;
  const versioned = process.env[envName]?.trim();
  if (versioned) return versioned;

  // Legacy single-key env (treated as active version material).
  const legacy = process.env.NDIS_ENCRYPTION_KEY?.trim();
  if (legacy && keyVersion === activeKeyVersion()) return legacy;

  if (
    !isProduction() &&
    process.env.NDIS_ALLOW_INSECURE_DEV_KEY === "true" &&
    keyVersion === activeKeyVersion()
  ) {
    return "mapable-dev-only-ndis-key-not-for-production";
  }

  if (isProduction()) {
    throw new NdisCryptoError(
      "NDIS_ENCRYPTION_KEY_MISSING",
      "Dedicated NDIS encryption key is required in production."
    );
  }

  throw new NdisCryptoError(
    "NDIS_ENCRYPTION_KEY_VERSION_UNAVAILABLE",
    `No encryption key configured for version ${keyVersion}.`
  );
}

function deriveKey(keyMaterial: string): Buffer {
  return createHash("sha256").update(keyMaterial).digest();
}

function getKeyForVersion(keyVersion: string): Buffer {
  return deriveKey(resolveKeyMaterial(keyVersion));
}

function assertSafeToEncrypt(): string {
  const version = activeKeyVersion();
  // Force resolution so missing production keys fail closed before encrypting.
  getKeyForVersion(version);
  return version;
}

export function encryptNdisSensitiveString(
  plaintext: string,
  aad?: string
): string {
  const keyVersion = assertSafeToEncrypt();
  const key = getKeyForVersion(keyVersion);
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  if (aad) cipher.setAAD(Buffer.from(aad, "utf8"));
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const envelope: NdisEncryptedEnvelope = {
    version: ENVELOPE_VERSION,
    keyVersion,
    algorithm: ALGORITHM,
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
    ciphertext: encrypted.toString("base64"),
  };
  return JSON.stringify(envelope);
}

function decryptEnvelope(
  envelope: NdisEncryptedEnvelope,
  aad?: string
): string {
  if (envelope.version !== ENVELOPE_VERSION) {
    throw new NdisCryptoError(
      "NDIS_CIPHERTEXT_MALFORMED",
      "Unsupported encrypted envelope version."
    );
  }
  if (envelope.algorithm !== ALGORITHM) {
    throw new NdisCryptoError(
      "NDIS_CIPHERTEXT_MALFORMED",
      "Unsupported encryption algorithm."
    );
  }
  let key: Buffer;
  try {
    key = getKeyForVersion(envelope.keyVersion);
  } catch (err) {
    if (err instanceof NdisCryptoError) throw err;
    throw new NdisCryptoError(
      "NDIS_ENCRYPTION_KEY_VERSION_UNAVAILABLE",
      `Key version ${envelope.keyVersion} is unavailable.`
    );
  }

  try {
    const iv = Buffer.from(envelope.iv, "base64");
    const tag = Buffer.from(envelope.authTag, "base64");
    const data = Buffer.from(envelope.ciphertext, "base64");
    if (!iv.length || !tag.length || !data.length) {
      throw new NdisCryptoError(
        "NDIS_CIPHERTEXT_MALFORMED",
        "Encrypted envelope fields are incomplete."
      );
    }
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    if (aad) decipher.setAAD(Buffer.from(aad, "utf8"));
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString(
      "utf8"
    );
  } catch (err) {
    if (err instanceof NdisCryptoError) throw err;
    throw new NdisCryptoError(
      "NDIS_DECRYPTION_FAILED",
      "Unable to decrypt NDIS sensitive value."
    );
  }
}

function decryptLegacyColonFormat(payload: string, aad?: string): string {
  void aad;
  const [ivB64, tagB64, dataB64] = payload.split(LEGACY_DELIMITER);
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new NdisCryptoError(
      "NDIS_CIPHERTEXT_MALFORMED",
      "Legacy ciphertext format is malformed."
    );
  }
  // Legacy values were encrypted with the active key material (or legacy env).
  const key = getKeyForVersion(activeKeyVersion());
  try {
    const iv = Buffer.from(ivB64, "base64");
    const tag = Buffer.from(tagB64, "base64");
    const data = Buffer.from(dataB64, "base64");
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString(
      "utf8"
    );
  } catch {
    throw new NdisCryptoError(
      "NDIS_DECRYPTION_FAILED",
      "Unable to decrypt legacy NDIS ciphertext."
    );
  }
}

export function decryptNdisSensitiveString(
  payload: string,
  aad?: string
): string {
  const trimmed = payload.trim();
  if (!trimmed) {
    throw new NdisCryptoError(
      "NDIS_CIPHERTEXT_MALFORMED",
      "Encrypted payload is empty."
    );
  }

  if (trimmed.startsWith("{")) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      throw new NdisCryptoError(
        "NDIS_CIPHERTEXT_MALFORMED",
        "Encrypted envelope JSON is malformed."
      );
    }
    if (!parsed || typeof parsed !== "object") {
      throw new NdisCryptoError(
        "NDIS_CIPHERTEXT_MALFORMED",
        "Encrypted envelope is not an object."
      );
    }
    return decryptEnvelope(parsed as NdisEncryptedEnvelope, aad);
  }

  return decryptLegacyColonFormat(trimmed, aad);
}

/** Re-encrypt legacy colon format to versioned envelope when decrypt succeeds. */
export function reencryptLegacyNdisCiphertextIfNeeded(
  payload: string,
  aad?: string
): { value: string; upgraded: boolean } {
  const trimmed = payload.trim();
  if (trimmed.startsWith("{")) {
    return { value: trimmed, upgraded: false };
  }
  const plaintext = decryptLegacyColonFormat(trimmed, aad);
  return { value: encryptNdisSensitiveString(plaintext, aad), upgraded: true };
}

export function encryptNdisSensitiveJson(
  value: unknown,
  aad?: string
): string {
  return encryptNdisSensitiveString(JSON.stringify(value), aad);
}

export function decryptNdisSensitiveJson<T = unknown>(
  payload: string,
  aad?: string
): T {
  const plaintext = decryptNdisSensitiveString(payload, aad);
  try {
    return JSON.parse(plaintext) as T;
  } catch {
    throw new NdisCryptoError(
      "NDIS_CIPHERTEXT_MALFORMED",
      "Decrypted JSON payload is malformed."
    );
  }
}

export function hashNdisPayload(canonicalJson: string): string {
  return createHash("sha256").update(canonicalJson, "utf8").digest("hex");
}

export function maskNdisNumber(value: string): string {
  if (!value) return "****";
  if (value.length <= 4) return "****";
  return `****${value.slice(-4)}`;
}

const SENSITIVE_KEY_PATTERN =
  /ndisNumber|ndisParticipantNumber|participantNumber|participant_ndis_number|ndisParticipantNumberEnc|access_token|refresh_token|client_secret|apiKey|authorization|dateOfBirth|bankAccount|bsb|diagnosis|healthNotes/i;

/** Australian NDIS participant numbers are typically 9 digits. */
const RAW_NDIS_NUMBER_PATTERN = /\b\d{9}\b/g;

export function redactNdisSensitiveFields<T>(input: T): T {
  return redactValue(input) as T;
}

function redactValue(value: unknown): unknown {
  if (value == null) return value;
  if (typeof value === "string") {
    return value.replace(RAW_NDIS_NUMBER_PATTERN, "[REDACTED_NDIS]");
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item));
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        if (
          typeof child === "string" &&
          (key.toLowerCase().includes("ndis") ||
            key.toLowerCase().includes("participantnumber"))
        ) {
          out[key] = maskNdisNumber(child);
        } else {
          out[key] = "[REDACTED]";
        }
      } else {
        out[key] = redactValue(child);
      }
    }
    return out;
  }
  return value;
}

/**
 * Compatibility wrappers — prefer encryptNdisSensitiveString /
 * decryptNdisSensitiveString for new code.
 */
export function encryptNdisNumber(value: string): string {
  return encryptNdisSensitiveString(value, "ndis-participant-number");
}

export function decryptNdisNumber(payload: string): string | null {
  try {
    return decryptNdisSensitiveString(payload, "ndis-participant-number");
  } catch (err) {
    if (
      err instanceof NdisCryptoError &&
      (err.code === "NDIS_CIPHERTEXT_MALFORMED" ||
        err.code === "NDIS_DECRYPTION_FAILED")
    ) {
      return null;
    }
    throw err;
  }
}

/** Timing-safe compare of payload hashes. */
export function safeEqualHex(a: string, b: string): boolean {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  if (aa.length !== bb.length) return false;
  return timingSafeEqual(aa, bb);
}

export function hmacNdisPayload(canonicalJson: string, keyVersion?: string): string {
  const version = keyVersion ?? activeKeyVersion();
  const key = getKeyForVersion(version);
  return createHmac("sha256", key).update(canonicalJson, "utf8").digest("hex");
}

export function getActiveNdisEncryptionKeyVersion(): string {
  return activeKeyVersion();
}
