import type { ConsentGrantType } from "@prisma/client";

import { logAuthAudit } from "@/lib/auth/auth-audit-service";
import { prisma } from "@/lib/prisma";

export async function grantPrivacyConsent(input: {
  userId: string;
  grantType: ConsentGrantType;
  purpose: string;
  version?: string;
}) {
  const grant = await prisma.consentGrant.create({
    data: {
      userId: input.userId,
      grantType: input.grantType,
      purpose: input.purpose,
      version: input.version ?? "1.0",
      status: "granted",
    },
  });

  await prisma.consentEvent.create({
    data: {
      userId: input.userId,
      grantId: grant.id,
      eventType: "granted",
      grantType: input.grantType,
      metadata: { purpose: input.purpose, version: grant.version },
    },
  });

  await logAuthAudit({
    userId: input.userId,
    action: "consent.granted",
    entityType: "ConsentGrant",
    entityId: grant.id,
    metadata: { grantType: input.grantType },
  });

  return grant;
}

export async function hasPrivacyConsent(
  userId: string,
  grantType: ConsentGrantType
): Promise<boolean> {
  const grant = await prisma.consentGrant.findFirst({
    where: {
      userId,
      grantType,
      status: "granted",
      revokedAt: null,
    },
  });
  return !!grant;
}

export async function getPrivacyConsentsForUser(userId: string) {
  return prisma.consentGrant.findMany({
    where: { userId, status: "granted", revokedAt: null },
    orderBy: { grantedAt: "desc" },
  });
}

/** Placeholder for APP/OAIC data export */
export async function requestPrivacyExportPlaceholder(userId: string) {
  await logAuthAudit({
    userId,
    action: "privacy.export_requested",
    metadata: { status: "placeholder" },
  });
  return { requestId: `export-${userId}-${Date.now()}`, status: "queued" };
}
