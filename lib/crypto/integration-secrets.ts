import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

import {
  EncryptionKeyUnavailableError,
  resolveDataEncryptionKey,
} from "@/lib/security/encryption-keys";

const ALGORITHM = "aes-256-gcm";

/**
 * Encrypt OAuth/token JSON for BillingIntegrationConnection.tokenCiphertext.
 * Format: `version:iv:tag:ciphertext` (base64 after version).
 */
export function encryptIntegrationSecret(plaintext: string): string {
  const { version, key } = resolveDataEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${version}:${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptIntegrationSecret(payload: string): string | null {
  try {
    const parts = payload.split(":");
    if (parts.length !== 4) return null;
    const [, ivB64, tagB64, dataB64] = parts;
    if (!ivB64 || !tagB64 || !dataB64) return null;
    const { key } = resolveDataEncryptionKey();
    const decipher = createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(ivB64, "base64"),
    );
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(dataB64, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch (err) {
    if (err instanceof EncryptionKeyUnavailableError) throw err;
    return null;
  }
}

export { EncryptionKeyUnavailableError };
