import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type FareBreakdownCents = {
  baseCents?: number;
  distanceCents?: number;
  assistanceCents?: number;
  tollsCents?: number;
  participantPaidCents?: number;
  potentiallyClaimableCents?: number;
  platformFeeCents?: number;
};

/** Select active pricing rule for a service type at a point in time. Never mutates history. */
export async function selectActivePricingRule(input: {
  serviceType: string;
  jurisdiction?: string;
  at?: Date;
}) {
  const at = input.at ?? new Date();
  return prisma.transportPricingRule.findFirst({
    where: {
      active: true,
      serviceType: input.serviceType,
      jurisdiction: input.jurisdiction ?? "AU",
      effectiveFrom: { lte: at },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: at } }],
    },
    orderBy: { effectiveFrom: "desc" },
  });
}

export async function importPricingRule(input: {
  versionId: string;
  serviceType: string;
  unit: string;
  rateCents: number;
  gstTreatment: string;
  sourceName: string;
  sourceUrl?: string;
  effectiveFrom: Date;
  importedByUserId?: string;
  activate?: boolean;
}) {
  return prisma.transportPricingRule.create({
    data: {
      versionId: input.versionId,
      serviceType: input.serviceType,
      unit: input.unit,
      rateCents: input.rateCents,
      gstTreatment: input.gstTreatment,
      sourceName: input.sourceName,
      sourceUrl: input.sourceUrl,
      effectiveFrom: input.effectiveFrom,
      importedByUserId: input.importedByUserId,
      active: input.activate ?? false,
      cancellationRules: {} as Prisma.InputJsonValue,
    },
  });
}

export function presentQuoteAmounts(breakdown: FareBreakdownCents, totalCents: number) {
  return {
    operatorFareCents: totalCents,
    participantPaidCents: breakdown.participantPaidCents ?? totalCents,
    potentiallyClaimableCents: breakdown.potentiallyClaimableCents ?? 0,
    tollsCents: breakdown.tollsCents ?? 0,
    platformFeeCents: breakdown.platformFeeCents ?? 0,
    currency: "AUD" as const,
    fundingLabel:
      (breakdown.potentiallyClaimableCents ?? 0) > 0
        ? ("Potentially claimable" as const)
        : ("Funding eligibility not verified" as const),
  };
}
