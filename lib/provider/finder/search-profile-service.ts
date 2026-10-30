import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  decryptProviderSearchPreferences,
  encryptProviderSearchPreferences,
} from "@/lib/crypto/provider-search-preferences";
import { prisma } from "@/lib/prisma";

import {
  PROVIDER_SEARCH_CONSENT_VERSION,
  providerSearchPreferencesSchema,
  type ProviderSearchPreferences,
  type SavedProviderSearchProfile,
} from "./search-profile-contract";

export async function readProviderSearchProfile(userId: string): Promise<SavedProviderSearchProfile | null> {
  const record = await prisma.providerSearchProfile.findUnique({ where: { userId } });
  if (!record) return null;
  if (record.consentVersion !== PROVIDER_SEARCH_CONSENT_VERSION) {
    throw new Error("Provider search profile needs renewed consent");
  }
  const preferences = providerSearchPreferencesSchema.parse(
    decryptProviderSearchPreferences(record.ciphertext),
  );
  return {
    preferences,
    consentVersion: record.consentVersion,
    consentGrantedAt: record.consentGrantedAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function saveProviderSearchProfile(input: {
  userId: string;
  actorRole: string;
  preferences: ProviderSearchPreferences;
}): Promise<SavedProviderSearchProfile> {
  const ciphertext = encryptProviderSearchPreferences(input.preferences);
  const now = new Date();
  const record = await prisma.$transaction(async (tx) => {
    const saved = await tx.providerSearchProfile.upsert({
      where: { userId: input.userId },
      create: {
        userId: input.userId,
        ciphertext,
        consentVersion: PROVIDER_SEARCH_CONSENT_VERSION,
        consentGrantedAt: now,
      },
      update: {
        ciphertext,
        consentVersion: PROVIDER_SEARCH_CONSENT_VERSION,
        consentGrantedAt: now,
      },
    });
    await createAuditEvent({
      tx,
      actorUserId: input.userId,
      actorRole: input.actorRole as never,
      participantId: input.userId,
      action: "provider_search_profile.consent_granted",
      entityType: "ProviderSearchProfile",
      entityId: saved.id,
      metadata: { consentVersion: PROVIDER_SEARCH_CONSENT_VERSION },
    });
    return saved;
  });
  return {
    preferences: input.preferences,
    consentVersion: record.consentVersion,
    consentGrantedAt: record.consentGrantedAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function deleteProviderSearchProfile(input: {
  userId: string;
  actorRole: string;
}): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.providerSearchProfile.findUnique({
      where: { userId: input.userId },
      select: { id: true },
    });
    if (existing) await tx.providerSearchProfile.delete({ where: { userId: input.userId } });
    await createAuditEvent({
      tx,
      actorUserId: input.userId,
      actorRole: input.actorRole as never,
      participantId: input.userId,
      action: "provider_search_profile.consent_withdrawn",
      entityType: "ProviderSearchProfile",
      entityId: existing?.id,
      metadata: { consentVersion: PROVIDER_SEARCH_CONSENT_VERSION },
    });
  });
}
