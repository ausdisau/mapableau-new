import {
  PUBLIC_SERVICES,
  claimsOk,
  verifiedPublicHref,
} from "./service-directory.ts";

const ALLOWED_INTERNAL_PATHS = new Set([
  "/dashboard",
  "/account",
  "/sign-in",
  "/sign-up",
]);

/**
 * Reject open redirects. Only same-origin relative paths on the allowlist
 * (or verified public service https hosts) are permitted.
 */
export function safeRedirectTarget(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const value = raw.trim();

  // Absolute URLs — only verified public service hosts.
  if (/^https?:\/\//i.test(value)) {
    return verifiedPublicHref(value);
  }

  // Protocol-relative or exotic schemes
  if (value.startsWith("//") || /^[a-z][a-z0-9+.-]*:/i.test(value)) {
    return null;
  }

  // Relative path only
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (value.includes("\\") || value.includes("@")) return null;

  try {
    const u = new URL(value, "https://adid.local");
    if (u.origin !== "https://adid.local") return null;
    if (u.username || u.password) return null;
    const path = u.pathname;
    if (ALLOWED_INTERNAL_PATHS.has(path)) {
      return `${path}${u.search}${u.hash}`;
    }
    // Allow nested Clerk catch-all under sign-in/sign-up
    if (path.startsWith("/sign-in") || path.startsWith("/sign-up")) {
      return `${path}${u.search}${u.hash}`;
    }
    return null;
  } catch {
    return null;
  }
}

/** Tokens must never appear in URLs or be written to localStorage by AD.iD code. */
export function urlContainsCredentialLeak(url: string): boolean {
  try {
    const u = new URL(url, "https://adid.local");
    const hay = `${u.search}${u.hash}`.toLowerCase();
    return (
      hay.includes("access_token") ||
      hay.includes("id_token") ||
      hay.includes("refresh_token") ||
      hay.includes("clerk_ticket") ||
      /[?&#]token=/.test(hay)
    );
  } catch {
    return true;
  }
}

export type TokenClaims = {
  iss?: unknown;
  sub?: unknown;
  aud?: unknown;
  exp?: unknown;
  nbf?: unknown;
  nonce?: unknown;
};

/**
 * Validate issuer/sub/audience/expiry for a candidate IdP JWT payload.
 * Does not accept self-declared roles. Signature/JWKS must be verified separately by Clerk SDK.
 */
export function validateOidcClaims(
  claims: TokenClaims,
  expected: { issuer: string; audience: string; nowSeconds?: number },
): { ok: true } | { ok: false; reason: string } {
  if (!claimsOk(expected.issuer, claims.sub)) {
    return { ok: false, reason: "invalid_issuer_or_subject" };
  }
  if (typeof claims.iss !== "string" || claims.iss !== expected.issuer) {
    return { ok: false, reason: "issuer_mismatch" };
  }
  const aud = claims.aud;
  const audOk =
    aud === expected.audience ||
    (Array.isArray(aud) && aud.includes(expected.audience));
  if (!audOk) return { ok: false, reason: "audience_mismatch" };

  const now = expected.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (typeof claims.exp !== "number" || claims.exp <= now) {
    return { ok: false, reason: "expired" };
  }
  if (typeof claims.nbf === "number" && claims.nbf > now + 60) {
    return { ok: false, reason: "not_yet_valid" };
  }
  return { ok: true };
}

/** Account linking by email alone is prohibited. */
export function accountLinkAttemptAllowed(input: {
  linkingFlagEnabled: boolean;
  proofOfBothAccounts: boolean;
  matchMethod: "email_only" | "issuer_subject" | "other";
}): { allowed: false; reason: string } | { allowed: true } {
  if (!input.linkingFlagEnabled) {
    return { allowed: false, reason: "ADID_ACCOUNT_LINKING_ENABLED is false" };
  }
  if (input.matchMethod === "email_only") {
    return { allowed: false, reason: "email_only_linking_forbidden" };
  }
  if (!input.proofOfBothAccounts) {
    return { allowed: false, reason: "independent_proof_required" };
  }
  return { allowed: true };
}

export function publicServiceIds(): string[] {
  return PUBLIC_SERVICES.map((s) => s.id);
}
