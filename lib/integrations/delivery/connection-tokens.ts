import type { BillingIntegrationConnection, Prisma } from "@prisma/client";

import {
  decryptIntegrationSecret,
  encryptIntegrationSecret,
} from "@/lib/crypto/integration-secrets";
import { prisma } from "@/lib/prisma";

export type StoredOAuthTokens = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  scopes?: string[];
  [key: string]: unknown;
};

export async function storeConnectionTokens(params: {
  organisationId: string;
  provider: string;
  tokens: StoredOAuthTokens;
  externalTenantId?: string;
  permissionMetadata?: Record<string, unknown>;
  connectedById?: string;
  status?: string;
}): Promise<BillingIntegrationConnection> {
  const tokenCiphertext = encryptIntegrationSecret(
    JSON.stringify(params.tokens),
  );
  const tokenExpiresAt = params.tokens.expiresAt
    ? new Date(params.tokens.expiresAt)
    : null;

  return prisma.billingIntegrationConnection.upsert({
    where: {
      organisationId_provider: {
        organisationId: params.organisationId,
        provider: params.provider,
      },
    },
    create: {
      organisationId: params.organisationId,
      provider: params.provider,
      status: params.status ?? "connected",
      externalTenantId: params.externalTenantId,
      tokenCiphertext,
      tokenExpiresAt,
      permissionMetadata: params.permissionMetadata as
        | Prisma.InputJsonValue
        | undefined,
      connectedById: params.connectedById,
      connectedAt: new Date(),
      revokedAt: null,
      revokedById: null,
    },
    update: {
      status: params.status ?? "connected",
      externalTenantId: params.externalTenantId,
      tokenCiphertext,
      tokenExpiresAt,
      permissionMetadata: params.permissionMetadata as
        | Prisma.InputJsonValue
        | undefined,
      connectedById: params.connectedById,
      connectedAt: new Date(),
      revokedAt: null,
      revokedById: null,
      lastError: null,
    },
  });
}

export function readConnectionTokens(
  connection: Pick<BillingIntegrationConnection, "tokenCiphertext" | "revokedAt">,
): StoredOAuthTokens | null {
  if (connection.revokedAt) return null;
  if (!connection.tokenCiphertext) return null;
  const plain = decryptIntegrationSecret(connection.tokenCiphertext);
  if (!plain) return null;
  try {
    return JSON.parse(plain) as StoredOAuthTokens;
  } catch {
    return null;
  }
}

/**
 * Disconnect: clear local ciphertext and mark revoked.
 * Third parties may retain historical data per their terms — surface that honestly.
 */
export async function revokeConnection(params: {
  organisationId: string;
  provider: string;
  revokedById?: string;
}): Promise<{
  connection: BillingIntegrationConnection;
  thirdPartyRetentionNote: string;
}> {
  const connection = await prisma.billingIntegrationConnection.update({
    where: {
      organisationId_provider: {
        organisationId: params.organisationId,
        provider: params.provider,
      },
    },
    data: {
      status: "disconnected",
      tokenCiphertext: null,
      tokenExpiresAt: null,
      revokedAt: new Date(),
      revokedById: params.revokedById,
    },
  });

  return {
    connection,
    thirdPartyRetentionNote:
      "MapAble cleared local OAuth tokens. The provider may retain historical records under their own retention policy; revoke access in the provider admin console if required.",
  };
}

/** Public-safe connection summary — never includes tokenCiphertext. */
export function toPublicConnectionSummary(
  connection: BillingIntegrationConnection,
) {
  return {
    id: connection.id,
    organisationId: connection.organisationId,
    provider: connection.provider,
    status: connection.status,
    externalTenantId: connection.externalTenantId,
    connectedAt: connection.connectedAt?.toISOString() ?? null,
    revokedAt: connection.revokedAt?.toISOString() ?? null,
    lastSyncAt: connection.lastSyncAt?.toISOString() ?? null,
    lastSuccessfulSyncAt:
      connection.lastSuccessfulSyncAt?.toISOString() ?? null,
    lastError: connection.lastError,
    hasEncryptedTokens: Boolean(connection.tokenCiphertext),
  };
}
