import {
  readConnectionTokens,
  storeConnectionTokens,
} from "@/lib/integrations/delivery/connection-tokens";
import { getDeputyOAuthConfig } from "@/lib/integrations/deputy/config";
import { parseDeputyEndpoint } from "@/lib/integrations/deputy/hostname";
import { refreshDeputyAccessToken } from "@/lib/integrations/deputy/oauth";
import { prisma } from "@/lib/prisma";

export type DeputyFetchResult = {
  status: number;
  bodyText: string;
  json: unknown | null;
};

export type DeputyHttp = (
  path: string,
  init?: RequestInit & { organisationId: string },
) => Promise<DeputyFetchResult>;

async function loadAccessContext(organisationId: string) {
  const connection = await prisma.billingIntegrationConnection.findUnique({
    where: {
      organisationId_provider: { organisationId, provider: "deputy" },
    },
  });
  if (!connection || connection.status === "disconnected" || connection.revokedAt) {
    throw new Error("Deputy is not connected for this organisation");
  }
  let tokens = readConnectionTokens(connection);
  if (!tokens?.accessToken || !tokens.endpoint) {
    throw new Error("Deputy tokens missing");
  }

  const expiresAt = tokens.expiresAt ? new Date(tokens.expiresAt).getTime() : 0;
  if (expiresAt && expiresAt < Date.now() + 60_000) {
    tokens = await refreshDeputyAccessToken(organisationId);
  }

  const { baseUrl, hostname } = parseDeputyEndpoint(String(tokens.endpoint));
  return { tokens, baseUrl, hostname, connection };
}

/**
 * Authenticated Deputy API call. Host is derived from stored OAuth endpoint only.
 */
export async function deputyFetch(
  path: string,
  init: RequestInit & { organisationId: string },
): Promise<DeputyFetchResult> {
  const { organisationId, ...req } = init;
  const ctx = await loadAccessContext(organisationId);
  const url = `${ctx.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  const res = await fetch(url, {
    ...req,
    headers: {
      Authorization: `Bearer ${ctx.tokens.accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(req.headers ?? {}),
    },
  });

  if (res.status === 401) {
    const refreshed = await refreshDeputyAccessToken(organisationId);
    const retry = await fetch(url, {
      ...req,
      headers: {
        Authorization: `Bearer ${refreshed.accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(req.headers ?? {}),
      },
    });
    const bodyText = await retry.text();
    let json: unknown | null = null;
    try {
      json = bodyText ? JSON.parse(bodyText) : null;
    } catch {
      json = null;
    }
    return { status: retry.status, bodyText, json };
  }

  const bodyText = await res.text();
  let json: unknown | null = null;
  try {
    json = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    json = null;
  }

  // Touch lastSuccessfulSyncAt on 2xx
  if (res.ok) {
    await prisma.billingIntegrationConnection.update({
      where: { id: ctx.connection.id },
      data: { lastSuccessfulSyncAt: new Date(), lastSyncAt: new Date(), lastError: null },
    });
  }

  return { status: res.status, bodyText, json };
}

/** Test seam: inject fake HTTP without real network. */
export function createDeputyClient(http: DeputyHttp = deputyFetch) {
  return { fetch: http, getConfig: getDeputyOAuthConfig };
}

export async function persistRotatedTokensForTests(
  organisationId: string,
  tokens: {
    accessToken: string;
    refreshToken: string;
    endpoint: string;
    expiresAt: string;
  },
) {
  return storeConnectionTokens({
    organisationId,
    provider: "deputy",
    externalTenantId: tokens.endpoint,
    tokens: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      endpoint: tokens.endpoint,
      expiresAt: tokens.expiresAt,
    },
  });
}
