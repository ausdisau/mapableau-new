import { prisma } from "@/lib/prisma";

/**
 * Purpose-specific consent slices. Fail closed: missing purpose grant = not granted.
 */
export async function recordPurposeConsent(params: {
  participantUserId: string;
  organisationId?: string | null;
  consentRecordId?: string | null;
  purposeKey: string;
  purposeLabel: string;
  granted: boolean;
  expiresAt?: Date | null;
}) {
  return prisma.participantConsentPurposeRecord.create({
    data: {
      participantUserId: params.participantUserId,
      organisationId: params.organisationId ?? null,
      consentRecordId: params.consentRecordId ?? null,
      purposeKey: params.purposeKey,
      purposeLabel: params.purposeLabel,
      granted: params.granted,
      grantedAt: params.granted ? new Date() : null,
      expiresAt: params.expiresAt ?? null,
    },
  });
}

export async function hasActivePurposeConsent(params: {
  participantUserId: string;
  purposeKey: string;
  organisationId?: string | null;
  now?: Date;
}): Promise<boolean> {
  const now = params.now ?? new Date();
  const row = await prisma.participantConsentPurposeRecord.findFirst({
    where: {
      participantUserId: params.participantUserId,
      purposeKey: params.purposeKey,
      organisationId: params.organisationId ?? undefined,
      granted: true,
      revokedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!row) return false;
  if (row.expiresAt && row.expiresAt.getTime() < now.getTime()) return false;
  return true;
}
