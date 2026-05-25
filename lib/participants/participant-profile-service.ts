import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import type { participantProfileSchema } from "@/lib/validation/participant";
import type { z } from "zod";

type ProfileInput = z.infer<typeof participantProfileSchema>;

export async function getParticipantProfileBundle(userId: string) {
  const [profile, preferences, accessNeeds] = await Promise.all([
    prisma.participantProfile.findUnique({ where: { userId } }),
    prisma.participantPreference.findUnique({ where: { userId } }),
    prisma.participantAccessNeed.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  return { profile, preferences, accessNeeds };
}

export async function upsertParticipantProfile(
  userId: string,
  input: ProfileInput,
  actorUserId: string
) {
  const profile = await prisma.participantProfile.upsert({
    where: { userId },
    create: {
      userId,
      displayName: input.displayName,
      preferredName: input.preferredName,
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
      primaryContactMethod: input.primaryContactMethod ?? "email",
      emergencyContact: input.emergencyContact ?? undefined,
      supportCoordinatorContact: input.supportCoordinatorContact ?? undefined,
      planManagerContact: input.planManagerContact ?? undefined,
      homeSuburb: input.homeSuburb,
      homeState: input.homeState,
      timezone: input.timezone ?? "Australia/Sydney",
      participantNotes: input.participantNotes,
    },
    update: {
      displayName: input.displayName,
      preferredName: input.preferredName,
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
      primaryContactMethod: input.primaryContactMethod,
      emergencyContact: input.emergencyContact ?? undefined,
      supportCoordinatorContact: input.supportCoordinatorContact ?? undefined,
      planManagerContact: input.planManagerContact ?? undefined,
      homeSuburb: input.homeSuburb,
      homeState: input.homeState,
      timezone: input.timezone,
      participantNotes: input.participantNotes,
    },
  });

  await createAuditEvent({
    actorUserId,
    action: "profile.updated",
    entityType: "ParticipantProfile",
    entityId: profile.id,
    participantId: userId,
  });

  return profile;
}

export async function saveParticipantPreferences(
  userId: string,
  data: {
    participantType?: string;
    fundingType?: string;
    primaryServiceRegion?: string;
    mainSupportGoals?: string;
    accessNeedsSummary?: string;
    communicationPreferencesJson?: Record<string, unknown>;
  },
  actorUserId: string
) {
  const jsonPrefs = data.communicationPreferencesJson as object | undefined;
  const prefs = await prisma.participantPreference.upsert({
    where: { userId },
    create: {
      userId,
      participantType: data.participantType,
      fundingType: data.fundingType,
      primaryServiceRegion: data.primaryServiceRegion,
      mainSupportGoals: data.mainSupportGoals,
      accessNeedsSummary: data.accessNeedsSummary,
      communicationPreferencesJson: jsonPrefs ?? {},
    },
    update: {
      participantType: data.participantType,
      fundingType: data.fundingType,
      primaryServiceRegion: data.primaryServiceRegion,
      mainSupportGoals: data.mainSupportGoals,
      accessNeedsSummary: data.accessNeedsSummary,
      ...(jsonPrefs !== undefined
        ? { communicationPreferencesJson: jsonPrefs }
        : {}),
    },
  });

  await createAuditEvent({
    actorUserId,
    action: "profile.updated",
    entityType: "participant_preferences",
    entityId: prefs.id,
    participantId: userId,
    metadata: { section: "preferences" },
  });

  return prefs;
}

export async function replaceAccessNeeds(
  userId: string,
  needs: Array<{
    category: string;
    plainLanguageNeed: string;
    importance?: string;
    notes?: string;
  }>,
  actorUserId: string
) {
  await prisma.participantAccessNeed.deleteMany({ where: { userId } });
  if (needs.length) {
    await prisma.participantAccessNeed.createMany({
      data: needs.map((n) => ({ userId, ...n })),
    });
  }

  await createAuditEvent({
    actorUserId,
    action: "accessibility.updated",
    entityType: "participant_access_needs",
    participantId: userId,
    metadata: { count: needs.length },
  });

  return prisma.participantAccessNeed.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}
