import { prisma } from "@/lib/prisma";

export interface QuotaDefinition {
  key: string;
  limit: number;
  windowSeconds?: number;
}

export interface TenantQuotas {
  quotas: QuotaDefinition[];
  updatedAt: string;
}

export async function getActiveQuotas(
  organisationId: string,
  profileKey = "default"
): Promise<TenantQuotas> {
  const row = await prisma.tenantQuotaProfile.findFirst({
    where: { organisationId, profileKey, active: true },
    orderBy: { updatedAt: "desc" },
  });
  const quotas = row?.quotasJson
    ? (row.quotasJson as unknown as { quotas?: QuotaDefinition[] }).quotas ?? []
    : [];
  return {
    quotas,
    updatedAt: (row?.updatedAt ?? new Date()).toISOString(),
  };
}

export async function upsertQuotas(input: {
  organisationId: string;
  profileKey?: string;
  quotas: QuotaDefinition[];
}) {
  return prisma.tenantQuotaProfile.upsert({
    where: {
      organisationId_profileKey: {
        organisationId: input.organisationId,
        profileKey: input.profileKey ?? "default",
      },
    },
    create: {
      organisationId: input.organisationId,
      profileKey: input.profileKey ?? "default",
      quotasJson: { quotas: input.quotas } as never,
    },
    update: { quotasJson: { quotas: input.quotas } as never },
  });
}

export function isWithinLimit(current: number, limit: number): boolean {
  if (!Number.isFinite(current) || current < 0) return false;
  if (!Number.isFinite(limit) || limit < 0) return false;
  return current < limit;
}
