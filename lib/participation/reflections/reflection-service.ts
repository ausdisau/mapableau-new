import { prisma } from "@/lib/prisma";
import { assertParticipationPlannerEnabled } from "@/lib/participation/feature-flags";
import { redactReflectionForOrganiser } from "@/lib/participation/privacy/redaction";
import type { ParticipationPrivacyLevelValue } from "@/lib/participation/types";

export function organiserCanReadReflection(): false {
  return false;
}

export async function createReflection(input: {
  participantId: string;
  body: string;
  planId?: string;
  goalId?: string;
  opportunityId?: string;
  eventId?: string;
  mood?: string;
  privacyLevel?: ParticipationPrivacyLevelValue;
}) {
  assertParticipationPlannerEnabled();
  return prisma.participationReflection.create({
    data: {
      ...input,
      privacyLevel: input.privacyLevel ?? "private",
    },
  });
}

export async function updateReflection(input: {
  reflectionId: string;
  participantId: string;
  body?: string;
  mood?: string;
  privacyLevel?: ParticipationPrivacyLevelValue;
}) {
  assertParticipationPlannerEnabled();
  const reflection = await prisma.participationReflection.findFirst({
    where: { id: input.reflectionId, participantId: input.participantId },
  });
  if (!reflection) throw new Error("REFLECTION_NOT_FOUND");
  return prisma.participationReflection.update({
    where: { id: reflection.id },
    data: {
      body: input.body,
      mood: input.mood,
      privacyLevel: input.privacyLevel,
    },
  });
}

export function redactReflectionForCommunityOrganiser<
  T extends { body?: string; mood?: string },
>(reflection: T) {
  return redactReflectionForOrganiser(reflection);
}
