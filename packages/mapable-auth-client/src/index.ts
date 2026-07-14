
import { authorityKindSchema, appRoleSchema } from "@mapable/validation";
import { z } from "zod";

/**
 * Native auth client contracts for OAuth/OIDC authorization-code + PKCE.
 * Client secrets must never enter the mobile bundle.
 */

export const tokenSetSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1).nullable(),
  expiresAt: z.number().int().positive(),
  tokenType: z.literal("Bearer"),
  scope: z.string().optional(),
}).strict();

export const deviceSessionSchema = z.object({
  id: z.string(),
  deviceLabel: z.string(),
  createdAt: z.string().datetime(),
  lastActiveAt: z.string().datetime(),
  current: z.boolean(),
}).strict();

export const authoritySnapshotSchema = z.object({
  kinds: z.array(authorityKindSchema),
  participantId: z.string().nullable(),
  organisationId: z.string().nullable(),
  role: appRoleSchema,
  expiresAt: z.string().datetime().nullable(),
  revoked: z.boolean(),
  stepUpRequiredFor: z.array(z.enum(["financial", "clinical", "high_impact"])),
}).strict();

export type TokenSet = z.infer<typeof tokenSetSchema>;
export type DeviceSession = z.infer<typeof deviceSessionSchema>;
export type AuthoritySnapshot = z.infer<typeof authoritySnapshotSchema>;

export type SecureTokenStore = {
  get(): Promise<TokenSet | null>;
  set(tokens: TokenSet): Promise<void>;
  clear(): Promise<void>;
};

export type AuthClientConfig = {
  issuer: string;
  clientId: string;
  redirectUri: string;
  scopes: string[];
  tokenStore: SecureTokenStore;
  discoveryUrl?: string;
};

export type PkceChallenge = {
  codeVerifier: string;
  codeChallenge: string;
  state: string;
  nonce: string;
};

/** Builds the authorize URL for authorization-code + PKCE (no client secret). */
export function buildAuthorizeUrl(
  config: AuthClientConfig,
  challenge: PkceChallenge,
): string {
  const base = config.discoveryUrl
    ? new URL("..", config.discoveryUrl).toString().replace(/\/$/, "")
    : config.issuer.replace(/\/$/, "");
  const url = new URL(`${base}/protocol/openid-connect/auth`);
  // Support Auth0-style authorize path when issuer looks like Auth0
  if (config.issuer.includes("auth0.com") || config.issuer.includes("auth0")) {
    return buildAuth0AuthorizeUrl(config, challenge);
  }
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", config.scopes.join(" "));
  url.searchParams.set("state", challenge.state);
  url.searchParams.set("nonce", challenge.nonce);
  url.searchParams.set("code_challenge", challenge.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

function buildAuth0AuthorizeUrl(
  config: AuthClientConfig,
  challenge: PkceChallenge,
): string {
  const url = new URL(`${config.issuer.replace(/\/$/, "")}/authorize`);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", config.scopes.join(" "));
  url.searchParams.set("state", challenge.state);
  url.searchParams.set("nonce", challenge.nonce);
  url.searchParams.set("code_challenge", challenge.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

export function assertNoClientSecret(env: Record<string, string | undefined>): void {
  const banned = [
    "AUTH0_CLIENT_SECRET",
    "GOOGLE_CLIENT_SECRET",
    "NEXTAUTH_SECRET",
    "DATABASE_URL",
    "OPENAI_API_KEY",
    "STRIPE_SECRET_KEY",
  ];
  for (const key of banned) {
    if (env[key]) {
      throw new Error(`Refusing to load server secret into mobile bundle: ${key}`);
    }
  }
}

export function isAccessTokenExpired(tokens: TokenSet, nowMs = Date.now()): boolean {
  return tokens.expiresAt <= nowMs + 30_000;
}
