import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

import { resolveDataEncryptionKey } from "@/lib/security/encryption-keys";

const ALGORITHM = "aes-256-gcm";
const AAD = Buffer.from("mapable.provider-search-preferences.v1", "utf8");

/** An authenticated, purpose-bound encrypted string. No session-key fallback. */
export function encryptProviderSearchPreferences(data: unknown): string {
  const { key, version } = resolveDataEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(AAD);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(data), "utf8"),
    cipher.final(),
  ]);
  return [version, iv.toString("base64"), cipher.getAuthTag().toString("base64"), ciphertext.toString("base64")].join(":");
}

/** Throws rather than treating corrupt/missing-key data as consented preferences. */
export function decryptProviderSearchPreferences(payload: string): unknown {
  const [version, ivEncoded, tagEncoded, dataEncoded, unexpected] = payload.split(":");
  const { key, version: currentVersion } = resolveDataEncryptionKey();
  if (unexpected !== undefined || !version || version !== currentVersion || !ivEncoded || !tagEncoded || !dataEncoded) {
    throw new Error("Encrypted provider-search profile cannot be read with the current key");
  }
  const iv = Buffer.from(ivEncoded, "base64");
  const tag = Buffer.from(tagEncoded, "base64");
  if (iv.length !== 12 || tag.length !== 16) throw new Error("Invalid encrypted profile payload");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAAD(AAD);
  decipher.setAuthTag(tag);
  const clear = Buffer.concat([decipher.update(Buffer.from(dataEncoded, "base64")), decipher.final()]);
  return JSON.parse(clear.toString("utf8")) as unknown;
}
