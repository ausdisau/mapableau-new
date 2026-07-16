import type { Prisma } from "@prisma/client";

import type { CurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import type { TransportAccessProfileUpdate } from "@/lib/validation/transport-access-profile-schemas";

export async function getTransportAccessProfile(user: CurrentUser) {
  const profile = await prisma.transportAccessProfile.findUnique({
    where: { userId: user.id },
  });
  return profile;
}

export async function upsertTransportAccessProfile(
  user: CurrentUser,
  input: TransportAccessProfileUpdate
) {
  const existing = await prisma.transportAccessProfile.findUnique({
    where: { userId: user.id },
  });

  const data = {
    mobilityDevices: (input.mobilityDevices ??
      existing?.mobilityDevices ??
      []) as Prisma.InputJsonValue,
    transferAbility:
      input.transferAbility !== undefined
        ? input.transferAbility
        : existing?.transferAbility,
    boardingMethod: (input.boardingMethod ??
      existing?.boardingMethod ??
      {}) as Prisma.InputJsonValue,
    defaultAssistance: (input.defaultAssistance ??
      existing?.defaultAssistance ??
      {}) as Prisma.InputJsonValue,
    communicationPrefs: (input.communicationPrefs ??
      existing?.communicationPrefs ??
      {}) as Prisma.InputJsonValue,
    sensoryPrefs: (input.sensoryPrefs ??
      existing?.sensoryPrefs ??
      {}) as Prisma.InputJsonValue,
    companionDefaults: (input.companionDefaults ??
      existing?.companionDefaults ??
      {}) as Prisma.InputJsonValue,
    serviceAnimal:
      input.serviceAnimal !== undefined
        ? input.serviceAnimal
        : (existing?.serviceAnimal ?? false),
    safePickupNotes:
      input.safePickupNotes !== undefined
        ? input.safePickupNotes
        : existing?.safePickupNotes,
    restrictedDriverNotes:
      input.restrictedDriverNotes !== undefined
        ? input.restrictedDriverNotes
        : existing?.restrictedDriverNotes,
    profileVersion: (existing?.profileVersion ?? 0) + 1,
  };

  return prisma.transportAccessProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...data },
    update: data,
  });
}

/** Safe summary for request prefill — excludes restricted driver notes. */
export function toAccessPassSummary(
  profile: NonNullable<Awaited<ReturnType<typeof getTransportAccessProfile>>>
) {
  return {
    profileVersion: profile.profileVersion,
    mobilityDevices: profile.mobilityDevices,
    transferAbility: profile.transferAbility,
    boardingMethod: profile.boardingMethod,
    defaultAssistance: profile.defaultAssistance,
    communicationPrefs: profile.communicationPrefs,
    sensoryPrefs: profile.sensoryPrefs,
    companionDefaults: profile.companionDefaults,
    serviceAnimal: profile.serviceAnimal,
    safePickupNotes: profile.safePickupNotes,
    updatedAt: profile.updatedAt.toISOString(),
  };
}
