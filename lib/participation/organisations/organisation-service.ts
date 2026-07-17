import { prisma } from "@/lib/prisma";
import { assertParticipationPlannerEnabled } from "@/lib/participation/feature-flags";

export interface CreateCommunityOrganisationInput {
  name: string;
  organisationType:
    | "community_group"
    | "charity"
    | "council"
    | "faith"
    | "arts"
    | "sport"
    | "education"
    | "employer"
    | "peer_network"
    | "other";
  tenantId?: string;
  description?: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  locationReference?: string;
  sourceReference?: string;
}

export async function createCommunityOrganisation(
  input: CreateCommunityOrganisationInput,
) {
  assertParticipationPlannerEnabled();
  return prisma.communityOrganisation.create({
    data: {
      ...input,
      verificationStatus: "pending",
    },
  });
}

export async function listCommunityOrganisations() {
  assertParticipationPlannerEnabled();
  return prisma.communityOrganisation.findMany({
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
}
