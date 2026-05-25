import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export type UpsertFoodPreferencesInput = {
  participantId: string;
  dietaryPreferences?: string[];
  texturePreferences?: string[];
  accessibilityNotes?: string;
  notificationOptInAmounts?: boolean;
  allergens?: string[];
  severityNotes?: string;
  emergencyPlan?: string;
  shareWithVendors?: boolean;
  shareWithDrivers?: boolean;
  substitutionPolicy?: "no_substitutions" | "contact_me" | "closest_match" | "provider_choice";
};

export async function upsertFoodPreferences(
  inputOrParticipantId: UpsertFoodPreferencesInput | string,
  maybeInput?: Omit<UpsertFoodPreferencesInput, "participantId">
) {
  const input: UpsertFoodPreferencesInput =
    typeof inputOrParticipantId === "string"
      ? { participantId: inputOrParticipantId, ...(maybeInput ?? {}) }
      : inputOrParticipantId;

  const preference = await prisma.foodParticipantPreference.upsert({
    where: { participantId: input.participantId },
    create: {
      participantId: input.participantId,
      dietaryPreferences: input.dietaryPreferences ?? [],
      texturePreferences: input.texturePreferences ?? [],
      accessibilityNotes: input.accessibilityNotes,
      notificationOptInAmounts: input.notificationOptInAmounts ?? false,
    },
    update: {
      dietaryPreferences: input.dietaryPreferences ?? [],
      texturePreferences: input.texturePreferences ?? [],
      accessibilityNotes: input.accessibilityNotes,
      notificationOptInAmounts: input.notificationOptInAmounts ?? false,
    },
  });

  const allergy = await prisma.foodAllergyProfile.upsert({
    where: { participantId: input.participantId },
    create: {
      participantId: input.participantId,
      allergens: input.allergens ?? [],
      severityNotes: input.severityNotes,
      emergencyPlan: input.emergencyPlan,
      shareWithVendors: input.shareWithVendors ?? false,
      shareWithDrivers: input.shareWithDrivers ?? false,
    },
    update: {
      allergens: input.allergens ?? [],
      severityNotes: input.severityNotes,
      emergencyPlan: input.emergencyPlan,
      shareWithVendors: input.shareWithVendors ?? false,
      shareWithDrivers: input.shareWithDrivers ?? false,
    },
  });

  if (input.substitutionPolicy) {
    await prisma.foodSubstitutionPreference.upsert({
      where: { id: `${preference.id}:default` },
      create: { id: `${preference.id}:default`, preferenceId: preference.id, policy: input.substitutionPolicy },
      update: { policy: input.substitutionPolicy },
    });
  }

  await createAuditEvent({
    actorUserId: input.participantId,
    action: "foods.preferences.updated",
    entityType: "FoodParticipantPreference",
    entityId: preference.id,
    participantId: input.participantId,
  });

  return { preference, allergy };
}

export async function getFoodPreferences(participantId: string) {
  return prisma.foodParticipantPreference.findUnique({
    where: { participantId },
    include: { substitutionPreferences: true },
  });
}