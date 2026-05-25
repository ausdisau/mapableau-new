import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function upsertDietaryProfile(
  userId: string,
  data: {
    allergies?: string[];
    intolerances?: string[];
    culturalPreferences?: string[];
    textureRequirement?: string;
    swallowingRiskFlag?: boolean;
    preferredMealTimes?: string[];
    supportRequiredForMeals?: boolean;
    nomineeCanOrder?: boolean;
    notes?: string;
  },
  actorUserId: string,
) {
  const profile = await prisma.dietaryProfile.upsert({
    where: { userId },
    create: {
      userId,
      allergies: data.allergies ?? [],
      intolerances: data.intolerances ?? [],
      culturalPreferences: data.culturalPreferences ?? [],
      textureRequirement: (data.textureRequirement as never) ?? "standard",
      swallowingRiskFlag: data.swallowingRiskFlag ?? false,
      preferredMealTimes: data.preferredMealTimes ?? [],
      supportRequiredForMeals: data.supportRequiredForMeals ?? false,
      nomineeCanOrder: data.nomineeCanOrder ?? false,
      notes: data.notes,
    },
    update: {
      allergies: data.allergies,
      intolerances: data.intolerances,
      culturalPreferences: data.culturalPreferences,
      textureRequirement: data.textureRequirement as never,
      swallowingRiskFlag: data.swallowingRiskFlag,
      preferredMealTimes: data.preferredMealTimes,
      supportRequiredForMeals: data.supportRequiredForMeals,
      nomineeCanOrder: data.nomineeCanOrder,
      notes: data.notes,
    },
  });

  await createAuditEvent({
    actorUserId,
    action: "foods.dietary_profile.updated",
    entityType: "DietaryProfile",
    entityId: profile.id,
    participantId: userId,
  });

  return profile;
}

export async function getDietaryProfile(userId: string) {
  return prisma.dietaryProfile.findUnique({ where: { userId } });
}
