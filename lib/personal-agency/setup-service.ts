import type { Prisma } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export type PaiSetupPreferences = {
  helpAreas?: string[];
  interfaceMethods?: string[];
  travelMode?: string;
  informationDensity?: "standard" | "simpler" | "detailed";
  setupCompletedAt?: string;
};

const SETUP_KEY = "paiSetup";

export async function getPaiSetupPreferences(
  userId: string,
): Promise<PaiSetupPreferences | null> {
  const profile = await prisma.accessibilityProfile.findUnique({
    where: { userId },
  });
  if (!profile?.digitalPreferences) return null;
  const prefs = profile.digitalPreferences as Record<string, unknown>;
  const setup = prefs[SETUP_KEY];
  if (!setup || typeof setup !== "object") return null;
  return setup as PaiSetupPreferences;
}

export async function savePaiSetupPreferences(
  userId: string,
  input: PaiSetupPreferences,
): Promise<PaiSetupPreferences> {
  const existing = await prisma.accessibilityProfile.findUnique({
    where: { userId },
  });

  const currentPrefs =
    (existing?.digitalPreferences as Record<string, unknown> | null) ?? {};

  const nextSetup: PaiSetupPreferences = {
    ...input,
    setupCompletedAt: new Date().toISOString(),
  };

  const digitalPreferences = {
    ...currentPrefs,
    [SETUP_KEY]: nextSetup,
  } as Prisma.InputJsonValue;

  if (existing) {
    await prisma.accessibilityProfile.update({
      where: { userId },
      data: { digitalPreferences },
    });
  } else {
    await prisma.accessibilityProfile.create({
      data: {
        userId,
        digitalPreferences,
      },
    });
  }

  await createAuditEvent({
    actorUserId: userId,
    participantId: userId,
    action: "PAI_SETUP_COMPLETED",
    entityType: "AccessibilityProfile",
    entityId: userId,
    metadata: {
      helpAreas: input.helpAreas ?? [],
      interfaceMethods: input.interfaceMethods ?? [],
      travelMode: input.travelMode ?? null,
    },
  });

  return nextSetup;
}

export async function needsFirstRunSetup(userId: string): Promise<boolean> {
  const setup = await getPaiSetupPreferences(userId);
  return !setup?.setupCompletedAt;
}
