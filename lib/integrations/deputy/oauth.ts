import { createHash, randomBytes } from "crypto";

import {
  readConnectionTokens,
  storeConnectionTokens,
  type StoredOAuthTokens,
} from "@/lib/integrations/delivery/connection-tokens";
import { assertDeputyConfigured, getDeputyOAuthConfig } from "@/lib/integrations/deputy/config";
import {
  DEPUTY_ONCE_BASE,
  parseDeputyEndpoint,
} from "@/lib/integrations/deputy/hostname";
import { prisma } from "@/lib/prisma";

const STATE_TTL_MS = 10 * 60 * 1000;

export type DeputyOAuthState = {
  organisationId: string;
  actorUserId: string;
  nonce: string;
  exp: number;
};

export function createDeputyOAuthState(input: {
  organisationId: string;
  actorUserId: string;
}): { state: string; payload: DeputyOAuthState } {
  const payload: DeputyOAuthState = {
    organisationId: input.organisationId,
    actorUserId: input.actorUserId,
    nonce: randomBytes(16).toString("hex"),
    exp: Date.now() + STATE_TTL_MS,
  };
  const state = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
  return { state, payload };
}

export function parseDeputyOAuthState(state: string): DeputyOAuthState {
  let payload: DeputyOAuthState;
  try {
    payload = JSON.parse(
      Buffer.from(state, "base64url").toString("utf8"),
    ) as DeputyOAuthState;
  } catch {
    throw new Error("Invalid Deputy OAuth state");
  }
  if (!payload.organisationId || !payload.actorUserId || !payload.nonce) {
    throw new Error("Invalid Deputy OAuth state payload");
  }
  if (payload.exp < Date.now()) {
    throw new Error("Deputy OAuth state expired");
  }
  return payload;
}

export function buildDeputyAuthorizeUrl(state: string): string {
  assertDeputyConfigured();
  const cfg = getDeputyOAuthConfig();
  const url = new URL(`${DEPUTY_ONCE_BASE}/my/oauth/login`);
  url.searchParams.set("client_id", cfg.clientId);
  url.searchParams.set("redirect_uri", cfg.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "longlife_refresh_token");
  url.searchParams.set("state", state);
  return url.toString();
}

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  endpoint: string;
  scope?: string;
};

async function postForm(
  url: string,
  body: Record<string, string>,
): Promise<TokenResponse> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });
  if (!res.ok) {
    throw new Error(`Deputy OAuth token exchange failed: HTTP ${res.status}`);
  }
  return (await res.json()) as TokenResponse;
}

export async function exchangeDeputyAuthCode(input: {
  code: string;
  organisationId: string;
  actorUserId: string;
}) {
  assertDeputyConfigured();
  const cfg = getDeputyOAuthConfig();
  const token = await postForm(`${DEPUTY_ONCE_BASE}/my/oauth/access_token`, {
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    redirect_uri: cfg.redirectUri,
    grant_type: "authorization_code",
    code: input.code,
    scope: "longlife_refresh_token",
  });

  const { hostname } = parseDeputyEndpoint(token.endpoint);
  const expiresAt = new Date(Date.now() + token.expires_in * 1000).toISOString();

  const stored = await storeConnectionTokens({
    organisationId: input.organisationId,
    provider: "deputy",
    externalTenantId: hostname,
    connectedById: input.actorUserId,
    status: "connected",
    permissionMetadata: {
      scope: token.scope ?? "longlife_refresh_token",
      endpoint: hostname,
    },
    tokens: {
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt,
      endpoint: hostname,
      scopes: ["longlife_refresh_token"],
    },
  });

  return { connection: stored, endpoint: hostname };
}

/**
 * Refresh returns a *replacement* refresh token — always persist the new pair.
 */
export async function refreshDeputyAccessToken(organisationId: string) {
  assertDeputyConfigured();
  const cfg = getDeputyOAuthConfig();
  const connection = await prisma.billingIntegrationConnection.findUnique({
    where: {
      organisationId_provider: { organisationId, provider: "deputy" },
    },
  });
  if (!connection) throw new Error("Deputy connection not found");
  const tokens = readConnectionTokens(connection);
  if (!tokens?.refreshToken || !tokens.endpoint) {
    throw new Error("Deputy refresh token or endpoint missing");
  }
  const { baseUrl, hostname } = parseDeputyEndpoint(String(tokens.endpoint));

  const token = await postForm(`${baseUrl}/oauth/access_token`, {
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    redirect_uri: cfg.redirectUri,
    grant_type: "refresh_token",
    refresh_token: tokens.refreshToken,
    scope: "longlife_refresh_token",
  });

  const expiresAt = new Date(Date.now() + token.expires_in * 1000).toISOString();
  const next: StoredOAuthTokens = {
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresAt,
    endpoint: hostname,
    scopes: ["longlife_refresh_token"],
  };

  await storeConnectionTokens({
    organisationId,
    provider: "deputy",
    externalTenantId: hostname,
    tokens: next,
    status: "connected",
    permissionMetadata: { endpoint: hostname, rotatedAt: new Date().toISOString() },
  });

  return next;
}

export function fingerprintDeputyState(state: string): string {
  return createHash("sha256").update(state).digest("hex").slice(0, 16);
}
