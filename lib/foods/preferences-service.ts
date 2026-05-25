import { checkConsent } from "@/lib/consent/consent-service";
import { prisma } from "@/lib/prisma";

import { logSensitiveAccess } from "./data-access-log";

export async function getParticipantPreferences(participantId: string) {
  return prisma.foodParticipantPreference.findUnique({
    where: { participantId },
  });
}

export async function upsertParticipantPreferences(
  participantId: string,
  data: {
    dietaryPreferences?: string[];
    accessibilityPreferences?: string[];
    communicationPreferences?: Record<string, unknown>;
    deliveryNotes?: string;
  }
) {
  return prisma.foodParticipantPreference.upsert({
    where: { participantId },
    create: {
      participantId,
      dietaryPreferences: data.dietaryPreferences ?? [],
      accessibilityPreferences: data.accessibilityPreferences ?? [],
      communicationPreferences: (data.communicationPreferences ?? {}) as object,
      deliveryNotes: data.deliveryNotes,
    },
    update: {
      dietaryPreferences: data.dietaryPreferences,
      accessibilityPreferences: data.accessibilityPreferences,
      communicationPreferences: data.communicationPreferences as object | undefined,
      deliveryNotes: data.deliveryNotes,
    },
  });
}

export async function getAllergyProfile(participantId: string) {
  return prisma.foodAllergyProfile.findUnique({ where: { participantId } });
}

export async function upsertAllergyProfile(
  participantId: string,
  data: { allergens: string[]; severityNotes?: string }
) {
  return prisma.foodAllergyProfile.upsert({
    where: { participantId },
    create: {
      participantId,
      allergens: data.allergens,
      severityNotes: data.severityNotes,
    },
    update: {
      allergens: data.allergens,
      severityNotes: data.severityNotes,
    },
  });
}

export async function getAllergyProfileForFulfilment(params: {
  actorUserId: string;
  participantId: string;
  vendorOrganisationId?: string;
}) {
  const ok = await checkConsent({
    subjectUserId: params.participantId,
    scope: "foods.allergy_share",
    grantedToOrganisationId: params.vendorOrganisationId,
  });
  if (!ok && params.actorUserId !== params.participantId) {
    throw new Error("CONSENT_REQUIRED");
  }

  if (params.actorUserId !== params.participantId) {
    await logSensitiveAccess({
      actorUserId: params.actorUserId,
      subjectUserId: params.participantId,
      resourceType: "FoodAllergyProfile",
      purpose: "order_fulfilment",
      consentScope: "foods.allergy_share",
    });
  }

  return getAllergyProfile(params.participantId);
}

export async function getSubstitutionPreferences(participantId: string) {
  return prisma.foodSubstitutionPreference.findUnique({
    where: { participantId },
  });
}

export async function upsertSubstitutionPreferences(
  participantId: string,
  policy: "allow_similar" | "contact_first" | "no_substitutions" | "vendor_choice",
  notes?: string
) {
  return prisma.foodSubstitutionPreference.upsert({
    where: { participantId },
    create: { participantId, policy, notes },
    update: { policy, notes },
  });
}
