/**
 * Alexa account linking configuration (Auth0 Authorization Code + PKCE S256).
 *
 * Secrets come from environment only — never hard-coded.
 * Amazon redirect URIs were issued by the Alexa Developer Console for this skill;
 * do not invent additional regional URLs.
 *
 * Claim state: IMPLEMENTED / NOT VERIFIED (manual Auth0 + Amazon config required).
 */

export const ALEXA_ACCOUNT_LINKING = {
  grantType: "authorization_code",
  pkceMethod: "S256",
  /**
   * Exact Amazon-issued callback URLs for skill M34KSZLLCGM3TX.
   * Register these in Auth0 Allowed Callback URLs — not in NEXTAUTH_URL.
   */
  redirectUris: [
    "https://alexa.amazon.co.jp/api/skill/link/M34KSZLLCGM3TX",
    "https://layla.amazon.com/api/skill/link/M34KSZLLCGM3TX",
    "https://pitangui.amazon.com/api/skill/link/M34KSZLLCGM3TX",
  ],
} as const;

export type AlexaAccountLinkingRedirectUri =
  (typeof ALEXA_ACCOUNT_LINKING.redirectUris)[number];

/** Narrow Home scopes — never a broad home:control that bypasses confirmation. */
export const ALEXA_HOME_SCOPES = [
  "openid",
  "profile",
  "offline_access",
  "home:state:read",
  "home:routine:evaluate",
  "home:routine:run",
  "home:action:propose",
] as const;

export type AlexaHomeScope = (typeof ALEXA_HOME_SCOPES)[number];

/** Scopes required before Alexa may propose Home actions. */
export const ALEXA_REQUIRED_ACTION_SCOPES = [
  "home:action:propose",
] as const;

export function isAllowedAlexaRedirectUri(uri: string): boolean {
  return (ALEXA_ACCOUNT_LINKING.redirectUris as readonly string[]).includes(uri);
}

export function normalizeAuth0Issuer(issuer: string): string {
  const trimmed = issuer.trim().replace(/\/+$/, "");
  if (!trimmed) {
    throw new Error("AUTH0_ALEXA_ISSUER is empty");
  }
  return trimmed;
}

export type Auth0AlexaEnvConfig = {
  clientId: string;
  /** Present only when configured — never log or return this value. */
  hasClientSecret: boolean;
  issuer: string;
  audience: string;
  authorizeUrl: string;
  tokenUrl: string;
};

/**
 * Server-side Auth0 Alexa application config.
 * Uses dedicated AUTH0_ALEXA_* vars — does not reuse browser login credentials.
 */
export function getAuth0AlexaConfig(): Auth0AlexaEnvConfig | null {
  const clientId = process.env.AUTH0_ALEXA_CLIENT_ID?.trim() ?? "";
  const clientSecret = process.env.AUTH0_ALEXA_CLIENT_SECRET?.trim() ?? "";
  const issuerRaw = process.env.AUTH0_ALEXA_ISSUER?.trim() ?? "";
  const audience = process.env.AUTH0_ALEXA_AUDIENCE?.trim() ?? "";

  if (!clientId || !clientSecret || !issuerRaw || !audience) {
    return null;
  }

  const issuer = normalizeAuth0Issuer(issuerRaw);
  return {
    clientId,
    hasClientSecret: true,
    issuer,
    audience,
    authorizeUrl: `${issuer}/authorize`,
    tokenUrl: `${issuer}/oauth/token`,
  };
}

export function isAlexaAccountLinkingConfigured(): boolean {
  return getAuth0AlexaConfig() !== null;
}

/** Public, non-secret status for operators / UI — never includes secrets or tokens. */
export function getAlexaAccountLinkingPublicStatus() {
  const config = getAuth0AlexaConfig();
  return {
    provider: "AMAZON_ALEXA" as const,
    grantType: ALEXA_ACCOUNT_LINKING.grantType,
    pkceMethod: ALEXA_ACCOUNT_LINKING.pkceMethod,
    redirectUriCount: ALEXA_ACCOUNT_LINKING.redirectUris.length,
    configured: config !== null,
    issuerConfigured: Boolean(config?.issuer),
    audienceConfigured: Boolean(config?.audience),
    clientIdConfigured: Boolean(config?.clientId),
    clientSecretConfigured: Boolean(config?.hasClientSecret),
    claimState: "IMPLEMENTED_NOT_VERIFIED" as const,
    realDeviceControl: "NOT_IMPLEMENTED" as const,
  };
}
