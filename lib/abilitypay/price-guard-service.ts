import type { AbilityPayPriceLimitStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type PriceGuardResult = {
  status: AbilityPayPriceLimitStatus;
  limitCents: number | null;
  message: string;
};

export async function checkPriceLimit(
  supportItemCode: string | null | undefined,
  unitPriceCents: number
): Promise<PriceGuardResult> {
  if (!supportItemCode?.trim()) {
    return {
      status: "unknown",
      limitCents: null,
      message: "No support item code — price limit cannot be checked.",
    };
  }

  const code = supportItemCode.trim();
  const catalogue = await prisma.ndisPricingCatalogueItem.findUnique({
    where: { supportItemCode: code },
  });
  const supportItem = await prisma.ndisSupportItem.findUnique({
    where: { code },
  });

  const limitCents =
    catalogue?.priceLimitCents ?? supportItem?.priceCapCents ?? null;

  if (limitCents == null) {
    return {
      status: "unknown",
      limitCents: null,
      message: `Support item ${code} is not in the active pricing catalogue.`,
    };
  }

  if (unitPriceCents > limitCents) {
    return {
      status: "fail",
      limitCents,
      message: `Unit price $${(unitPriceCents / 100).toFixed(2)} exceeds the limit of $${(limitCents / 100).toFixed(2)}.`,
    };
  }

  const warningThreshold = Math.floor(limitCents * 0.95);
  if (unitPriceCents >= warningThreshold) {
    return {
      status: "warning",
      limitCents,
      message: `Unit price is within 5% of the price limit ($${(limitCents / 100).toFixed(2)}).`,
    };
  }

  return {
    status: "pass",
    limitCents,
    message: `Unit price is within the price limit of $${(limitCents / 100).toFixed(2)}.`,
  };
}
