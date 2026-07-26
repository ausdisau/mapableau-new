import { createHmac, timingSafeEqual } from "node:crypto";

export type SocketAuthClaims = {
  userId: string;
  userRole: string;
};

/**
 * Verify the Socket.IO handshake token.
 *
 * Expected format (HMAC-SHA256): `v1.<base64url(payload)>.<base64url(sig)>`
 * payload JSON: `{ userId, userRole, exp }`
 *
 * SECURITY: Reject missing/forged tokens. Uses NEXTAUTH_SECRET or
 * REALTIME_SOCKET_SECRET as the HMAC key.
 */
export function verifySocketToken(token: string): SocketAuthClaims | null {
  if (!token || typeof token !== "string" || token.length < 16) {
    return null;
  }

  const secret =
    process.env.REALTIME_SOCKET_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim();
  if (!secret) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") {
    return null;
  }

  const [, encodedPayload, encodedSig] = parts;
  const expectedSig = createHmac("sha256", secret)
    .update(`v1.${encodedPayload}`)
    .digest("base64url");

  const a = Buffer.from(encodedSig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as { userId?: string; userRole?: string; exp?: number };

    if (!payload.userId || typeof payload.userId !== "string") return null;
    if (typeof payload.exp === "number" && payload.exp * 1000 < Date.now()) {
      return null;
    }

    return {
      userId: payload.userId,
      userRole:
        typeof payload.userRole === "string" && payload.userRole
          ? payload.userRole
          : "participant",
    };
  } catch {
    return null;
  }
}
