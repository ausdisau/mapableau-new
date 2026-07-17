import { prisma } from "@/lib/prisma";
import { assertParticipationPlannerEnabled } from "@/lib/participation/feature-flags";
import type {
  OpportunityDeliveryModeValue,
  OpportunityStatusValue,
  ParticipantApprovedDiscoveryFilters,
  ParticipationDomainValue,
} from "@/lib/participation/types";

export interface OpportunitySummary {
  id: string;
  title: string;
  domain: ParticipationDomainValue;
  sponsored: boolean;
  status: OpportunityStatusValue;
  deliveryMode: OpportunityDeliveryModeValue;
}

export interface SeparatedOpportunities<T extends { sponsored: boolean }> {
  organic: T[];
  sponsored: T[];
}

export function assertNoDiagnosisInference(source: string | null | undefined) {
  if (!source) return;
  if (/\b(diagnosis|autism|adhd|cerebral palsy|psychosocial)\b/i.test(source)) {
    throw new Error("DIAGNOSIS_INFERENCE_FORBIDDEN");
  }
}

export function separateSponsoredResults<T extends { sponsored: boolean }>(
  results: T[],
): SeparatedOpportunities<T> {
  return {
    organic: results.filter((item) => !item.sponsored),
    sponsored: results.filter((item) => item.sponsored),
  };
}

export function explainParticipantApprovedFilters(
  filters: ParticipantApprovedDiscoveryFilters,
): string[] {
  const explanations: string[] = [];
  if (filters.domains?.length) {
    explanations.push(`domains:${filters.domains.join(",")}`);
  }
  if (filters.keywords?.length) {
    explanations.push(`keywords:${filters.keywords.join(",")}`);
  }
  if (filters.dateFrom || filters.dateTo) explanations.push("date-window");
  if (filters.accessNeeds?.length) {
    explanations.push(`access:${filters.accessNeeds.join(",")}`);
  }
  if (filters.deliveryModes?.length) {
    explanations.push(`delivery:${filters.deliveryModes.join(",")}`);
  }
  return explanations;
}

export async function listOpportunities(
  filters: ParticipantApprovedDiscoveryFilters = {},
) {
  assertParticipationPlannerEnabled();
  filters.keywords?.forEach(assertNoDiagnosisInference);
  const opportunities = await prisma.participationOpportunity.findMany({
    where: {
      status: "published",
      domain: filters.domains?.length ? { in: filters.domains } : undefined,
      deliveryMode: filters.deliveryModes?.length
        ? { in: filters.deliveryModes }
        : undefined,
      OR: filters.keywords?.length
        ? filters.keywords.map((keyword) => ({
            title: { contains: keyword, mode: "insensitive" as const },
          }))
        : undefined,
    },
    orderBy: { publishedAt: "desc" },
    take: 100,
  });
  return {
    ...separateSponsoredResults(opportunities),
    mode: "unranked" as const,
    filtersUsed: explainParticipantApprovedFilters(filters),
  };
}

export async function createOpportunity(input: {
  title: string;
  description: string;
  domain: ParticipationDomainValue;
  opportunityType: string;
  deliveryMode: OpportunityDeliveryModeValue;
  sourceReference: string;
  organisationId?: string;
  status?: OpportunityStatusValue;
  sponsored?: boolean;
  costDescription?: string;
  priceCents?: number;
  fundingClaims?: string;
  accessPlaceId?: string;
}) {
  assertParticipationPlannerEnabled();
  return prisma.participationOpportunity.create({
    data: {
      ...input,
      status: input.status ?? "draft",
      sponsored: input.sponsored ?? false,
      moderationStatus: "pending",
    },
  });
}
