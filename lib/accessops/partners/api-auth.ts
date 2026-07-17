import { createHash, randomBytes } from "crypto";

export function hashPartnerApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function createPartnerApiKey(): {
  key: string;
  hash: string;
  hint: string;
} {
  const key = `mapable_acc_${randomBytes(24).toString("base64url")}`;
  return { key, hash: hashPartnerApiKey(key), hint: key.slice(-6) };
}
