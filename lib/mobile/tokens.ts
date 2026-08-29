import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { mobileApiConfig } from "@/lib/mobile/config";

export type MobileTokenClaims = {
  sub: string;
  email: string;
  primaryRole: string;
  typ: "access" | "refresh";
  exp: number;
  iat: number;
  jti: string;
};

function b64url(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function fromB64url(input: string): Buffer {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(b64, "base64");
}

function sign(payloadB64: string): string {
  const secret = mobileApiConfig.tokenSecret;
  if (!secret) {
    throw new Error("MAPABLE_MOBILE_TOKEN_SECRET or NEXTAUTH_SECRET required");
  }
  return b64url(
    createHmac("sha256", secret).update(payloadB64).digest(),
  );
}

export function mintMobileToken(
  claims: Omit<MobileTokenClaims, "iat" | "jti" | "exp"> & {
    ttlSeconds: number;
  },
): { token: string; expiresAtEpochMs: number; jti: string } {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + claims.ttlSeconds;
  const jti = randomBytes(16).toString("hex");
  const body: MobileTokenClaims = {
    sub: claims.sub,
    email: claims.email,
    primaryRole: claims.primaryRole,
    typ: claims.typ,
    iat,
    exp,
    jti,
  };
  const payloadB64 = b64url(JSON.stringify(body));
  const sig = sign(payloadB64);
  return {
    token: `${payloadB64}.${sig}`,
    expiresAtEpochMs: exp * 1000,
    jti,
  };
}

export function verifyMobileToken(
  token: string,
  expectedTyp?: "access" | "refresh",
): MobileTokenClaims | null {
  try {
    const [payloadB64, sig] = token.split(".");
    if (!payloadB64 || !sig) return null;
    const expected = sign(payloadB64);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const claims = JSON.parse(
      fromB64url(payloadB64).toString("utf8"),
    ) as MobileTokenClaims;
    if (expectedTyp && claims.typ !== expectedTyp) return null;
    if (claims.exp * 1000 < Date.now()) return null;
    if (!claims.sub) return null;
    return claims;
  } catch {
    return null;
  }
}

export function bearerFromAuthorizationHeader(
  header: string | null,
): string | null {
  if (!header) return null;
  const m = /^Bearer\s+(.+)$/i.exec(header.trim());
  return m?.[1]?.trim() || null;
}
