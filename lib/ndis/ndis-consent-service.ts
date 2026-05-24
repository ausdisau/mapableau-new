import type { NdisConsentScope } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function hasNdisConsent(
  participantId: string,
  grantedToId: string,
  scope: NdisConsentScope
): Promise<boolean> {
  const grant = await prisma.ndisConsentGrant.findFirst({
    where: {
      participantId,
      grantedToId,
      scope,
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });
  return Boolean(grant);
}

export async function grantNdisConsent(params: {
  participantId: string;
  grantedToId: string;
  scope: NdisConsentScope;
  expiresAt?: Date;
}) {
  return prisma.ndisConsentGrant.create({ data: params });
}

export async function revokeNdisConsent(grantId: string) {
  return prisma.ndisConsentGrant.update({
    where: { id: grantId },
    data: { revokedAt: new Date() },
  });
}

export async function logNdisDataAccess(params: {
  actorUserId: string;
  participantId: string;
  scope: NdisConsentScope;
  granted: boolean;
}) {
  await prisma.ndisDataAccessLog.create({ data: params });
}

export async function requireNdisConsent(
  participantId: string,
  grantedToId: string,
  scope: NdisConsentScope
) {
  const ok = await hasNdisConsent(participantId, grantedToId, scope);
  await logNdisDataAccess({
    actorUserId: grantedToId,
    participantId,
    scope,
    granted: ok,
  });
  if (!ok) {
    throw new Error("NDIS_CONSENT_REQUIRED");
  }
}
