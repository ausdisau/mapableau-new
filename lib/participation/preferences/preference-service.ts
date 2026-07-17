import { prisma } from "@/lib/prisma";
import { asJson } from "@/lib/prisma-json";
import { assertParticipationPlannerEnabled } from "@/lib/participation/feature-flags";
import { defaultPrivacyForParticipation } from "@/lib/participation/privacy/sensitive-domains";
import type {
  ParticipationDomainValue,
  ParticipationPrivacyLevelValue,
} from "@/lib/participation/types";

export interface UpsertPreferenceInput {
  participantId: string;
  goalId?: string;
  domain?: ParticipationDomainValue;
  preferenceKey: string;
  preference: Record<string, unknown>;
  privacyLevel?: ParticipationPrivacyLevelValue;
}

export async function createPreference(input: UpsertPreferenceInput) {
  assertParticipationPlannerEnabled();
  return prisma.participationPreference.create({
    data: {
      participantId: input.participantId,
      goalId: input.goalId,
      domain: input.domain,
      preferenceKey: input.preferenceKey,
      preference: asJson(input.preference) ?? {},
      privacyLevel:
        input.privacyLevel ??
        defaultPrivacyForParticipation({ domain: input.domain }),
    },
  });
}

export async function listPreferencesForParticipant(participantId: string) {
  assertParticipationPlannerEnabled();
  return prisma.participationPreference.findMany({
    where: { participantId, active: true },
    orderBy: { updatedAt: "desc" },
  });
}
