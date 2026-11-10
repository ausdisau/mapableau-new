import { randomBytes } from "crypto";

import {
  readConnectionTokens,
  storeConnectionTokens,
} from "@/lib/integrations/delivery/connection-tokens";
import {
  assertXeroDirectConfigured,
  getXeroDirectConfig,
} from "@/lib/integrations/xero/config";
import { prisma } from "@/lib/prisma";

const STATE_TTL_MS = 10 * 60 * 1000;
const XERO_SCOPES = [
  "openid",
  "profile",
  "email",
  "accounting.transactions",
  "accounting.contacts.read",
  "accounting.settings.read",
  "offline_access",
].join(" ");

export type XeroOAuthState = {
  organisationId: string;
  actorUserId: string;
  nonce: string;
  exp: number;
};

export function createXeroOAuthState(input: {
  organisationId: string;
  actorUserId: string;
}): { state: string } {
  const payload: XeroOAuthState = {
    organisationId: input.organisationId,
    actorUserId: input.actorUserId,
    nonce: randomBytes(16).toString("hex"),
    exp: Date.now() + STATE_TTL_MS,
  };
  return {
    state: Buffer.from(JSON.stringify(payload), "utf8").toString("base64url"),
  };
}

export function parseXeroOAuthState(state: string): XeroOAuthState {
  let payload: XeroOAuthState;
  try {
    payload = JSON.parse(
      Buffer.from(state, "base64url").toString("utf8"),
    ) as XeroOAuthState;
  } catch {
    throw new Error("Invalid Xero OAuth state");
  }
  if (!payload.organisationId || !payload.actorUserId || payload.exp < Date.now()) {
    throw new Error("Invalid or expired Xero OAuth state");
  }
  return payload;
}

export function buildXeroAuthorizeUrl(state: string): string {
  assertXeroDirectConfigured();
  const cfg = getXeroDirectConfig();
  const url = new URL(cfg.identityUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", cfg.clientId);
  url.searchParams.set("redirect_uri", cfg.redirectUri);
  url.searchParams.set("scope", XERO_SCOPES);
  url.searchParams.set("state", state);
  return url.toString();
}

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
};

async function exchangeToken(body: Record<string, string>): Promise<TokenResponse> {
  const cfg = getXeroDirectConfig();
  const basic = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString(
    "base64",
  );
  const res = await fetch(cfg.tokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body).toString(),
  });
  if (!res.ok) {
    throw new Error(`Xero token exchange failed: HTTP ${res.status}`);
  }
  return (await res.json()) as TokenResponse;
}

export async function exchangeXeroAuthCode(input: {
  code: string;
  organisationId: string;
  actorUserId: string;
  /** Selected tenant after /connections — required for multi-org. */
  tenantId?: string;
}) {
  assertXeroDirectConfigured();
  const cfg = getXeroDirectConfig();
  const token = await exchangeToken({
    grant_type: "authorization_code",
    code: input.code,
    redirect_uri: cfg.redirectUri,
  });

  const tenants = await listXeroConnections(token.access_token);
  const tenantId =
    input.tenantId ??
    (tenants.length === 1 ? tenants[0]?.tenantId : undefined);

  if (!tenantId) {
    return {
      needsTenantSelection: true as const,
      tenants,
      tokens: token,
    };
  }

  const connection = await storeConnectionTokens({
    organisationId: input.organisationId,
    provider: "xero",
    externalTenantId: tenantId,
    connectedById: input.actorUserId,
    status: "connected",
    permissionMetadata: {
      scope: token.scope,
      tenants,
      authMode: "authorization_code",
    },
    tokens: {
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt: new Date(Date.now() + token.expires_in * 1000).toISOString(),
      scopes: token.scope?.split(" "),
      tenantId,
    },
  });

  return {
    needsTenantSelection: false as const,
    connection,
    tenantId,
  };
}

export async function listXeroConnections(accessToken: string) {
  const cfg = getXeroDirectConfig();
  const res = await fetch(cfg.connectionsUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Xero connections failed: HTTP ${res.status}`);
  const data = (await res.json()) as Array<{
    tenantId: string;
    tenantName?: string;
    tenantType?: string;
  }>;
  return data.map((t) => ({
    tenantId: t.tenantId,
    tenantName: t.tenantName,
    tenantType: t.tenantType,
  }));
}

export async function refreshXeroAccessToken(organisationId: string) {
  assertXeroDirectConfigured();
  const connection = await prisma.billingIntegrationConnection.findUnique({
    where: {
      organisationId_provider: { organisationId, provider: "xero" },
    },
  });
  if (!connection) throw new Error("Xero connection not found");
  const tokens = readConnectionTokens(connection);
  if (!tokens?.refreshToken) throw new Error("Xero refresh token missing");

  const token = await exchangeToken({
    grant_type: "refresh_token",
    refresh_token: tokens.refreshToken,
  });

  await storeConnectionTokens({
    organisationId,
    provider: "xero",
    externalTenantId: connection.externalTenantId ?? undefined,
    status: "connected",
    tokens: {
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt: new Date(Date.now() + token.expires_in * 1000).toISOString(),
      tenantId: connection.externalTenantId ?? undefined,
      scopes: token.scope?.split(" "),
    },
  });

  return token;
}
