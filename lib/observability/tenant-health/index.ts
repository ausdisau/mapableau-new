import { prisma } from "@/lib/prisma";

export async function recordTenantHealthWindow(input: {
  organisationId: string;
  windowStart: Date;
  windowEnd: Date;
  availabilityRatio?: number | null;
  errorBudgetBurn?: number | null;
  slowRequestRatio?: number | null;
  saturationSummary?: unknown;
  incidentIds?: string[];
}) {
  return prisma.tenantOperationalHealth.create({
    data: {
      organisationId: input.organisationId,
      windowStart: input.windowStart,
      windowEnd: input.windowEnd,
      availabilityRatio: input.availabilityRatio ?? null,
      errorBudgetBurn: input.errorBudgetBurn ?? null,
      slowRequestRatio: input.slowRequestRatio ?? null,
      saturationSummary: (input.saturationSummary as never) ?? undefined,
      incidentIds: input.incidentIds ?? [],
    },
  });
}

export async function latestTenantHealth(organisationId: string) {
  return prisma.tenantOperationalHealth.findFirst({
    where: { organisationId },
    orderBy: { windowEnd: "desc" },
  });
}
