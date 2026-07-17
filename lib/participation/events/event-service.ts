import { prisma } from "@/lib/prisma";
import { assertParticipationPlannerEnabled } from "@/lib/participation/feature-flags";
import type {
  OpportunityDeliveryModeValue,
  OpportunityStatusValue,
  ParticipationDomainValue,
} from "@/lib/participation/types";

export async function listEvents(
  params: {
    domains?: ParticipationDomainValue[];
    from?: Date;
    to?: Date;
  } = {},
) {
  assertParticipationPlannerEnabled();
  return prisma.communityEvent.findMany({
    where: {
      status: "published",
      domain: params.domains?.length ? { in: params.domains } : undefined,
      startsAt:
        params.from || params.to
          ? { gte: params.from, lte: params.to }
          : undefined,
    },
    include: { accessProfile: true },
    orderBy: { startsAt: "asc" },
    take: 100,
  });
}

export async function createEvent(input: {
  title: string;
  domain: ParticipationDomainValue;
  startsAt: Date;
  deliveryMode: OpportunityDeliveryModeValue;
  sourceReference: string;
  description?: string;
  endsAt?: Date;
  opportunityId?: string;
  organisationId?: string;
  status?: OpportunityStatusValue;
  accessPlaceId?: string;
}) {
  assertParticipationPlannerEnabled();
  return prisma.communityEvent.create({
    data: {
      ...input,
      status: input.status ?? "draft",
      moderationStatus: "pending",
    },
  });
}
