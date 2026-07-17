import { createHash, randomBytes } from "node:crypto";

import type { ConsentDirective } from "@prisma/client";

/**
 * Consent-bound tokens.
 *
 * A CBT is a short-lived opaque token minted from a directive + a
 * verifier/entity, so downstream services can reference it without needing
 * to know the participant's identity.
 *
 * Tokens are stateless: they are a hash of (directiveId, entityKey, expiresAt,
 * nonce). Servers look up the directive by id and confirm it is still
 * effective. If the directive is withdrawn, the token is invalid on the very
 * next call — no cache TTL is honoured. This is our continuous-access-
 * evaluation entry point.
 */

export interface ConsentBoundToken {
  raw: string;
  directiveId: string;
  entityKey: string | null;
  expiresAt: string;
  nonce: string;
}

export function mintConsentBoundToken(input: {
  directive: Pick<ConsentDirective, "id" | "effectiveUntil">;
  entityKey?: string | null;
  ttlSeconds?: number;
}): ConsentBoundToken {
  const nonce = randomBytes(16).toString("hex");
  const now = Date.now();
  const ttl = (input.ttlSeconds ?? 900) * 1000;
  const directiveExpiry =
    input.directive.effectiveUntil?.getTime() ?? now + ttl;
  const expiresAt = new Date(Math.min(now + ttl, directiveExpiry)).toISOString();
  const payload = {
    d: input.directive.id,
    e: input.entityKey ?? null,
    x: expiresAt,
    n: nonce,
  };
  const raw =
    "cbt_" +
    Buffer.from(JSON.stringify(payload)).toString("base64url") +
    "." +
    signPayload(payload);
  return {
    raw,
    directiveId: input.directive.id,
    entityKey: input.entityKey ?? null,
    expiresAt,
    nonce,
  };
}

function signPayload(payload: unknown): string {
  const secret = process.env.CONSENT_TOKEN_SECRET ?? "mapable-wave9-cbt";
  return createHash("sha256")
    .update(secret + JSON.stringify(payload))
    .digest("hex")
    .slice(0, 32);
}

export function parseConsentBoundToken(raw: string): ConsentBoundToken | null {
  if (!raw.startsWith("cbt_")) return null;
  const [body, sig] = raw.slice(4).split(".");
  if (!body || !sig) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (signPayload(payload) !== sig) return null;
    return {
      raw,
      directiveId: payload.d,
      entityKey: payload.e ?? null,
      expiresAt: payload.x,
      nonce: payload.n,
    };
  } catch {
    return null;
  }
}
