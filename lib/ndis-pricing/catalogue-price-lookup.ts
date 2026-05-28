import { prisma } from "@/lib/prisma";

export type CataloguePriceLookup = {
  supportItemCode: string;
  priceCapCents: number;
  unitType: string;
  formattedLine: string;
};

/**
 * Latest catalogue cap for a support item code (NDIS Pricing Intelligence).
 */
export async function lookupCataloguePrice(
  supportItemCode: string
): Promise<CataloguePriceLookup | null> {
  const code = supportItemCode.trim();
  if (!code) return null;

  const price = await prisma.ndisSupportItemPrice.findFirst({
    where: { supportItem: { code } },
    orderBy: { effectiveFrom: "desc" },
    include: { supportItem: { select: { code: true, name: true } } },
  });
  if (!price) return null;

  const dollars = (price.priceCapCents / 100).toFixed(2);
  const unit = price.unitType ?? "hour";
  const name = price.supportItem.name ?? code;

  return {
    supportItemCode: code,
    priceCapCents: price.priceCapCents,
    unitType: unit,
    formattedLine: `${name} (${code}) — catalogue cap $${dollars} AUD per ${unit}. Claims remain manual; no auto-submit to NDIA.`,
  };
}
