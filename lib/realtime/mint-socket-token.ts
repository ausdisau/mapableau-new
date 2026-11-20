/**
 * Next.js-side mint helper for Socket.IO auth tokens.
 * Shares the HMAC scheme with apps/realtime-server (dedicated SOCKETIO_AUTH_SECRET).
 */

import { createHmac } from "crypto";

export type MintableSocketIdentity = {
  userId: string;
  role: string;
  roomGrants?: string[];
};

function resolveMintSecret(): string {
  const dedicated = process.env.SOCKETIO_AUTH_SECRET?.trim() || "";
  if (dedicated.length >= 16) return dedicated;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SOCKETIO_AUTH_SECRET_MISSING");
  }
  const fallback = process.env.NEXTAUTH_SECRET?.trim() || "";
  if (fallback.length >= 16) return fallback;
  throw new Error("SOCKETIO_AUTH_SECRET_MISSING");
}

/**
 * Mint an HMAC socket token with required expiry.
 * Call from authenticated API routes only; never expose the signing secret to clients.
 */
export function mintSocketAuthTokenForUser(
  identity: MintableSocketIdentity,
  options?: { expiresInSec?: number }
): { token: string; expiresAt: string } {
  const secret = resolveMintSecret();
  const expiresInSec = options?.expiresInSec ?? 60 * 60;
  const exp = Math.floor(Date.now() / 1000) + expiresInSec;
  const payload = {
    userId: identity.userId,
    role: identity.role,
    roomGrants: identity.roomGrants,
    exp,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url"
  );
  const signature = createHmac("sha256", secret)
    .update(encoded)
    .digest("base64url");
  return {
    token: `${encoded}.${signature}`,
    expiresAt: new Date(exp * 1000).toISOString(),
  };
}
