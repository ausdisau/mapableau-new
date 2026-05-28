import { createHmac, timingSafeEqual } from "node:crypto";

export type SocketAuthResult =
  | { ok: true; userId: string }
  | { ok: false; reason: string };

const DEV_PREFIX = "mapable.dev:";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function signUserId(userId: string, secret: string): string {
  return createHmac("sha256", secret).update(userId).digest("hex").slice(0, 32);
}

/**
 * Token formats (v1):
 * - Signed: `<userId>.<hmac-hex>` when SOCKET_AUTH_SECRET is set
 * - Dev: `mapable.dev:<userId>` when SOCKET_ALLOW_DEV_TOKEN=true
 */
export function authenticateSocketToken(token: string): SocketAuthResult {
  const trimmed = token?.trim();
  if (!trimmed) {
    return { ok: false, reason: "missing_token" };
  }

  if (process.env.SOCKET_ALLOW_DEV_TOKEN === "true" && trimmed.startsWith(DEV_PREFIX)) {
    const userId = trimmed.slice(DEV_PREFIX.length).trim();
    if (!userId) return { ok: false, reason: "invalid_dev_token" };
    return { ok: true, userId };
  }

  const secret = process.env.SOCKET_AUTH_SECRET?.trim();
  if (secret) {
    const dot = trimmed.lastIndexOf(".");
    if (dot <= 0) return { ok: false, reason: "invalid_signed_token" };
    const userId = trimmed.slice(0, dot);
    const sig = trimmed.slice(dot + 1);
    if (!userId || !sig) return { ok: false, reason: "invalid_signed_token" };
    const expected = signUserId(userId, secret);
    if (!safeEqual(sig, expected)) {
      return { ok: false, reason: "invalid_signature" };
    }
    return { ok: true, userId };
  }

  if (trimmed.length > 10 && /^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return { ok: true, userId: trimmed };
  }

  return { ok: false, reason: "invalid_token" };
}

export function createSocketAuthToken(userId: string): string {
  const secret = process.env.SOCKET_AUTH_SECRET?.trim();
  if (secret) {
    return `${userId}.${signUserId(userId, secret)}`;
  }
  if (process.env.SOCKET_ALLOW_DEV_TOKEN === "true") {
    return `${DEV_PREFIX}${userId}`;
  }
  return userId;
}

/** @deprecated Use authenticateSocketToken */
export function verifySocketToken(token: string): boolean {
  return authenticateSocketToken(token).ok;
}
