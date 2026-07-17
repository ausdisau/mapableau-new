import { createHash } from "crypto";

export function signWebhookPayload(secret: string, payload: string): string {
  return createHash("sha256").update(`${secret}.${payload}`).digest("hex");
}

export function verifyWebhookSignature(
  secret: string,
  payload: string,
  signature: string,
): boolean {
  return signWebhookPayload(secret, payload) === signature;
}
