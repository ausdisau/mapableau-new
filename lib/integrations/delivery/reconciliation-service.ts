import type { IntegrationReconciliation, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * Record an observed remote discrepancy. Does not overwrite MapAble booking/invoice state.
 * Human review is required before any compensating local update.
 */
export async function recordReconciliationObservation(input: {
  provider: "deputy" | "xero" | "stripe";
  organisationId: string;
  externalTenantId?: string;
  cursorSince?: Date;
  observedRemoteStatus?: string;
  discrepancyType?: string;
  lastResult?: string;
  metadataJson?: Record<string, unknown>;
}): Promise<IntegrationReconciliation> {
  return prisma.integrationReconciliation.create({
    data: {
      provider: input.provider,
      organisationId: input.organisationId,
      externalTenantId: input.externalTenantId,
      cursorSince: input.cursorSince,
      observedRemoteStatus: input.observedRemoteStatus,
      discrepancyType: input.discrepancyType,
      lastResult: input.lastResult ?? "observed",
      metadataJson: input.metadataJson as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function markReconciliationReviewed(input: {
  id: string;
  reviewedById: string;
  lastResult: string;
}): Promise<IntegrationReconciliation> {
  return prisma.integrationReconciliation.update({
    where: { id: input.id },
    data: {
      reviewedById: input.reviewedById,
      reviewedAt: new Date(),
      lastResult: input.lastResult,
    },
  });
}

export async function listOpenReconciliations(params: {
  organisationId: string;
  provider?: "deputy" | "xero" | "stripe";
  limit?: number;
}) {
  return prisma.integrationReconciliation.findMany({
    where: {
      organisationId: params.organisationId,
      provider: params.provider,
      reviewedAt: null,
    },
    orderBy: { createdAt: "desc" },
    take: params.limit ?? 50,
  });
}
