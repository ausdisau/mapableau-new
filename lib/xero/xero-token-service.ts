import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  decryptBillingSecret,
  encryptBillingSecret,
} from "@/lib/crypto/billing";
import { prisma } from "@/lib/prisma";
import { refreshXeroToken } from "@/lib/xero/xero-client";

export async function getValidXeroAccessToken(organisationId: string) {
  const conn = await prisma.xeroConnection.findUnique({
    where: { organisationId },
  });
  if (!conn || conn.status !== "active") throw new Error("XERO_NOT_CONNECTED");

  const refreshToken = decryptBillingSecret(conn.refreshTokenEnc);
  if (!refreshToken) throw new Error("XERO_TOKEN_DECRYPT_FAILED");

  const expiresSoon =
    conn.expiresAt && conn.expiresAt.getTime() < Date.now() + 60_000;

  if (!expiresSoon) {
    const access = decryptBillingSecret(conn.accessTokenEnc);
    if (!access) throw new Error("XERO_TOKEN_DECRYPT_FAILED");
    return { accessToken: access, tenantId: conn.tenantId, connection: conn };
  }

  try {
    const tokens = await refreshXeroToken(refreshToken);
    const updated = await prisma.xeroConnection.update({
      where: { id: conn.id },
      data: {
        accessTokenEnc: encryptBillingSecret(tokens.access_token),
        refreshTokenEnc: encryptBillingSecret(tokens.refresh_token),
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        status: "active",
      },
    });
    return {
      accessToken: tokens.access_token,
      tenantId: updated.tenantId,
      connection: updated,
    };
  } catch {
    await prisma.xeroConnection.update({
      where: { id: conn.id },
      data: { status: "refresh_failed" },
    });
    await createAuditEvent({
      action: "xero.token_refresh_failed",
      entityType: "XeroConnection",
      entityId: conn.id,
    });
    throw new Error("XERO_REFRESH_FAILED");
  }
}
