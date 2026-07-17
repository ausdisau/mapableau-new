import { prisma } from "@/lib/prisma";
import { assertParticipationPlannerEnabled } from "@/lib/participation/feature-flags";

export function moderationRequiresHumanReview(text: string): boolean {
  return /\b(unsafe|hate|abuse|exploit|segregat)\b/i.test(text);
}

export async function updateOpportunityModerationStatus(input: {
  opportunityId: string;
  moderationStatus: string;
}) {
  assertParticipationPlannerEnabled();
  return prisma.participationOpportunity.update({
    where: { id: input.opportunityId },
    data: { moderationStatus: input.moderationStatus },
  });
}

export async function updateEventModerationStatus(input: {
  eventId: string;
  moderationStatus: string;
}) {
  assertParticipationPlannerEnabled();
  return prisma.communityEvent.update({
    where: { id: input.eventId },
    data: { moderationStatus: input.moderationStatus },
  });
}
