import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const TOKEN_TTL_MS = 15 * 60 * 1000;

export type PendingLinkPayload = {
  provider: string;
  providerSubject: string;
  email: string;
  name: string;
  exp: number;
};

function linkTokenSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is required for account linking tokens");
  }
  return secret;
}

function signPayload(encoded: string): string {
  return createHmac("sha256", linkTokenSecret()).update(encoded).digest("base64url");
}

export function createPendingLinkToken(
  payload: Omit<PendingLinkPayload, "exp">,
): string {
  const body: PendingLinkPayload = {
    ...payload,
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(body)).toString("base64url");
  const sig = signPayload(encoded);
  return `${encoded}.${sig}`;
}

export function verifyPendingLinkToken(token: string): PendingLinkPayload | null {
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return null;

  const expected = signPayload(encoded);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as PendingLinkPayload;
    if (!payload.email || !payload.provider || !payload.providerSubject) {
      return null;
    }
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function createLinkStateNonce(): string {
  return randomBytes(16).toString("hex");
}
