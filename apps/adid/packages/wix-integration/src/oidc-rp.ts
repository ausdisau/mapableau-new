/**
 * Clerk as OAuth 2.0 / OIDC IdP for separate relying parties.
 * Each RP (MapAble, AccessiBooks, CripSquare, Disapedia) needs its own client,
 * callback URI, audience, and independent authorization — never shared SSO
 * assertions until that client is verified.
 */

export type RelyingPartyId =
  | "mapable"
  | "accessibooks"
  | "cripsquare"
  | "disapedia";

export type RelyingPartyConfig = {
  id: RelyingPartyId;
  clientId: string;
  /** Exact redirect URI allowlist. */
  redirectUris: readonly string[];
  audience: string;
  /** Required OIDC scopes; consent must be collected per RP. */
  scopes: readonly string[];
};

export type AuthorizationRequest = {
  clientId: string;
  redirectUri: string;
  responseType: "code";
  state: string;
  codeChallenge: string;
  codeChallengeMethod: "S256";
  nonce: string;
  scope: string;
};

export type AuthorizationCheckResult =
  | { ok: true; rp: RelyingPartyConfig }
  | { ok: false; reason: string };

export function validateAuthorizationRequest(
  rps: readonly RelyingPartyConfig[],
  req: AuthorizationRequest,
): AuthorizationCheckResult {
  const rp = rps.find((r) => r.clientId === req.clientId);
  if (!rp) return { ok: false, reason: "unknown_client" };
  if (req.responseType !== "code") return { ok: false, reason: "response_type_must_be_code" };
  if (!req.state || req.state.length < 16) return { ok: false, reason: "state_required" };
  if (!req.nonce || req.nonce.length < 8) return { ok: false, reason: "nonce_required" };
  if (req.codeChallengeMethod !== "S256") {
    return { ok: false, reason: "pkce_s256_required" };
  }
  if (!req.codeChallenge || req.codeChallenge.length < 43) {
    return { ok: false, reason: "pkce_challenge_required" };
  }
  if (!rp.redirectUris.includes(req.redirectUri)) {
    return { ok: false, reason: "redirect_uri_not_registered" };
  }
  const requested = new Set(req.scope.split(/\s+/).filter(Boolean));
  for (const scope of requested) {
    if (!rp.scopes.includes(scope)) {
      return { ok: false, reason: `scope_not_allowed:${scope}` };
    }
  }
  return { ok: true, rp };
}

/**
 * Validate ID token payload claims after JWKS signature verification
 * (signature verification remains Clerk SDK / jose responsibility).
 */
export function validateIdTokenClaims(
  claims: {
    iss?: unknown;
    sub?: unknown;
    aud?: unknown;
    exp?: unknown;
    nonce?: unknown;
  },
  expected: {
    issuer: string;
    audience: string;
    nonce: string;
    nowSeconds?: number;
  },
): { ok: true } | { ok: false; reason: string } {
  if (typeof claims.iss !== "string" || claims.iss !== expected.issuer) {
    return { ok: false, reason: "issuer_mismatch" };
  }
  if (typeof claims.sub !== "string" || !claims.sub) {
    return { ok: false, reason: "sub_required" };
  }
  const audOk =
    claims.aud === expected.audience ||
    (Array.isArray(claims.aud) && claims.aud.includes(expected.audience));
  if (!audOk) return { ok: false, reason: "audience_mismatch" };
  const now = expected.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (typeof claims.exp !== "number" || claims.exp <= now) {
    return { ok: false, reason: "expired" };
  }
  if (claims.nonce !== expected.nonce) {
    return { ok: false, reason: "nonce_mismatch" };
  }
  return { ok: true };
}
