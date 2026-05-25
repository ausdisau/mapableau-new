import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { encryptBillingSecret } from "@/lib/crypto/billing";
import { prisma } from "@/lib/prisma";
import {
  exchangeXeroCode,
  fetchXeroConnections,
  getXeroOAuthAuthorizeUrl,
} from "@/lib/xero/xero-client";

const STATE_COOKIE = "xero_oauth_state";

export function startXeroOAuth(organisationId: string) {
  const state = `${organisationId}:${randomBytes(16).toString("hex")}`;
  const url = getXeroOAuthAuthorizeUrl(state);
  return { url, state };
}

export async function setXeroOAuthStateCookie(state: string) {
  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
}

export async function completeXeroOAuth(params: {
  code: string;
  state: string;
  connectedByUserId: string;
}) {
  const cookieStore = await cookies();
  const savedState = cookieStore.get(STATE_COOKIE)?.value;
  if (!savedState || savedState !== params.state) {
    throw new Error("XERO_STATE_MISMATCH");
  }
  cookieStore.delete(STATE_COOKIE);

  const [organisationId] = params.state.split(":");
  if (!organisationId) throw new Error("INVALID_STATE");

  const tokens = await exchangeXeroCode(params.code);
  const connections = await fetchXeroConnections(tokens.access_token);
  const tenant = connections[0];
  if (!tenant) throw new Error("XERO_NO_TENANT");

  const record = await prisma.xeroConnection.upsert({
    where: { organisationId },
    create: {
      organisationId,
      tenantId: tenant.tenantId,
      tenantName: tenant.tenantName,
      accessTokenEnc: encryptBillingSecret(tokens.access_token),
      refreshTokenEnc: encryptBillingSecret(tokens.refresh_token),
      scopes: tokens.scope,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      connectedByUserId: params.connectedByUserId,
      status: "active",
    },
    update: {
      tenantId: tenant.tenantId,
      tenantName: tenant.tenantName,
      accessTokenEnc: encryptBillingSecret(tokens.access_token),
      refreshTokenEnc: encryptBillingSecret(tokens.refresh_token),
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      status: "active",
    },
  });

  await createAuditEvent({
    actorUserId: params.connectedByUserId,
    action: "xero.connected",
    entityType: "XeroConnection",
    entityId: record.id,
    metadata: { organisationId, tenantId: tenant.tenantId },
  });

  return record;
}

export async function disconnectXero(
  organisationId: string,
  actorUserId: string
) {
  const conn = await prisma.xeroConnection.findUnique({
    where: { organisationId },
  });
  if (!conn) return null;

  await prisma.xeroConnection.update({
    where: { id: conn.id },
    data: {
      status: "disconnected",
      accessTokenEnc: encryptBillingSecret("revoked"),
      refreshTokenEnc: encryptBillingSecret("revoked"),
    },
  });

  await createAuditEvent({
    actorUserId,
    action: "xero.disconnected",
    entityType: "XeroConnection",
    entityId: conn.id,
    metadata: { mfaPlaceholder: true },
  });

  return conn;
}

export function hashXeroPayload(payload: object) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}
