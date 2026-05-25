import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";

function getBillingKey(): Buffer {
  const secret =
    process.env.BILLING_ENCRYPTION_KEY ??
    process.env.NDIS_ENCRYPTION_KEY ??
    process.env.NEXTAUTH_SECRET ??
    "mapable-dev-only-billing-key";
  return createHash("sha256").update(secret).digest();
}

export function encryptBillingSecret(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getBillingKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptBillingSecret(payload: string): string | null {
  try {
    const [ivB64, tagB64, dataB64] = payload.split(":");
    if (!ivB64 || !tagB64 || !dataB64) return null;
    const iv = Buffer.from(ivB64, "base64");
    const tag = Buffer.from(tagB64, "base64");
    const data = Buffer.from(dataB64, "base64");
    const decipher = createDecipheriv(ALGORITHM, getBillingKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString(
      "utf8"
    );
  } catch {
    return null;
  }
}
