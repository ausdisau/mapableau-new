import { prisma } from "@/lib/prisma";

export type NdisPriceLookup = {
  supportItemCode: string;
  unitAmountCents: number;
  unitType: string;
  source: "catalogue" | "fallback";
};

/**
 * Resolve NDIS catalogue price for a support item code.
 * Returns null when no catalogue row exists — callers should keep zero-cent placeholder.
 */
export async function lookupNdisUnitPrice(
  supportItemCode: string | null | undefined
): Promise<NdisPriceLookup | null> {
  if (!supportItemCode?.trim()) return null;

  const price = await prisma.ndisSupportItemPrice.findFirst({
    where: { supportItem: { code: supportItemCode, active: true } },
    orderBy: { effectiveFrom: "desc" },
    include: { supportItem: true },
  });

  if (!price) return null;

  return {
    supportItemCode,
    unitAmountCents: price.priceCapCents,
    unitType: price.unitType,
    source: "catalogue",
  };
}

export async function resolveInvoiceLinePricing(params: {
  supportItemCode?: string | null;
  description: string;
  quantity?: number;
}) {
  const quantity = params.quantity ?? 1;
  const lookup = await lookupNdisUnitPrice(params.supportItemCode);

  if (lookup) {
    return {
      description: params.description,
      supportItemCode: lookup.supportItemCode,
      unitAmountCents: lookup.unitAmountCents,
      totalAmountCents: lookup.unitAmountCents * quantity,
      claimableByNdis: true,
      pricingSource: lookup.source,
    };
  }

  return {
    description: params.description,
    supportItemCode: params.supportItemCode ?? undefined,
    unitAmountCents: 0,
    totalAmountCents: 0,
    claimableByNdis: Boolean(params.supportItemCode),
    pricingSource: "fallback" as const,
  };
}
