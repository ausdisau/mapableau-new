import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const ALGO = "aes-256-gcm";
const KEY_VERSION = "v1";

function getKey(): Buffer {
  const secret =
    process.env.TRANSPORT_LOCATION_ENCRYPTION_KEY ??
    process.env.NEXTAUTH_SECRET ??
    "dev-only-transport-location-key-change-me";
  return createHash("sha256").update(secret).digest();
}

export type EncryptedPayload = {
  ciphertext: string;
  iv: string;
  tag: string;
  keyVersion: string;
};

export function encryptTransportPayload(plain: unknown): EncryptedPayload {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, getKey(), iv);
  const json = JSON.stringify(plain);
  const encrypted = Buffer.concat([cipher.update(json, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    keyVersion: KEY_VERSION,
  };
}

export function decryptTransportPayload(payload: EncryptedPayload): unknown {
  const decipher = createDecipheriv(
    ALGO,
    getKey(),
    Buffer.from(payload.iv, "base64")
  );
  decipher.setAuthTag(Buffer.from(payload.tag, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, "base64")),
    decipher.final(),
  ]);
  return JSON.parse(decrypted.toString("utf8"));
}

export function serializeEncryptedPayload(payload: EncryptedPayload): string {
  return JSON.stringify(payload);
}

export function parseEncryptedPayload(raw: string | null | undefined): EncryptedPayload | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as EncryptedPayload;
    if (!parsed.ciphertext || !parsed.iv || !parsed.tag) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Coarse coordinates suitable for pre-assignment matching (~1km). */
export function coarsenCoordinates(lat: number, lng: number): { lat: number; lng: number } {
  return {
    lat: Math.round(lat * 100) / 100,
    lng: Math.round(lng * 100) / 100,
  };
}
