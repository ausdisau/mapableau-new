import { prisma } from "@/lib/prisma";
import { evaluatePriceRules } from "@/lib/ndis-pricing/price-rule-engine";
import { enrichWarningsForAudience } from "@/lib/ndis-pricing/plain-language-pricing-explainer";
import { getActiveCatalogueVersion } from "@/lib/ndis-pricing/pricing-version-service";
import type { calculateQuoteSchema, QuoteLineResult } from "@/types/ndis-pricing";
import { NDIS_DISCLAIMER } from "@/types/ndis-pricing";
import type { z } from "zod";

export type CalculateQuoteInput = z.infer<typeof calculateQuoteSchema>;

async function resolvePriceCap(
  supportItemCode: string | undefined,
  versionId?: string
) {
  if (!supportItemCode) return { priceCapCents: null as number | null, unitType: null as string | null };

  const version =
    versionId != null
      ? await prisma.ndisPriceCatalogueVersion.findUnique({ where: { id: versionId } })
      : await getActiveCatalogueVersion();

  if (!version) {
    const item = await prisma.ndisSupportItem.findUnique({ where: { code: supportItemCode } });
    return { priceCapCents: item?.priceCapCents ?? null, unitType: item?.unitType ?? null };
  }

  const price = await prisma.ndisSupportItemPrice.findFirst({
    where: {
      versionId: version.id,
      supportItem: { code: supportItemCode },
    },
    orderBy: { effectiveFrom: "desc" },
  });
  return {
    priceCapCents: price?.priceCapCents ?? null,
    unitType: price?.unitType ?? null,
  };
}

export async function calculateQuote(
  input: CalculateQuoteInput,
  audience: "participant" | "provider" | "admin" = "provider"
): Promise<{ lines: QuoteLineResult[]; disclaimer: string; totalCents: number }> {
  const results: QuoteLineResult[] = [];
  let totalCents = 0;

  for (const line of input.lines) {
    const { priceCapCents, unitType } = await resolvePriceCap(
      line.supportItemCode,
      input.versionId
    );
    const unitAmountCents =
      line.unitAmountCents ?? priceCapCents ?? undefined;
    const qty = line.quantity;
    const total =
      unitAmountCents != null ? Math.round(unitAmountCents * qty) : undefined;

    let warnings = await evaluatePriceRules({
      supportItemCode: line.supportItemCode,
      unitAmountCents: unitAmountCents ?? 0,
      quantity: qty,
      unitType: line.unitType ?? unitType,
      priceCapCents,
      serviceDate: line.serviceDate ? new Date(line.serviceDate) : null,
    });

    if (!line.supportItemCode) {
      warnings.push({
        code: "missing_support_item_code",
        severity: "warning",
        message: "No support item code — quote line needs review.",
      });
    }

    warnings = enrichWarningsForAudience(warnings, audience);
    const status =
      warnings.some((w) => w.severity === "error") ||
      warnings.some((w) => w.severity === "warning")
        ? "review_required"
        : "calculated";

    if (total != null) totalCents += total;

    results.push({
      description: line.description,
      supportItemCode: line.supportItemCode,
      quantity: qty,
      unitType: line.unitType ?? unitType ?? undefined,
      unitAmountCents,
      totalAmountCents: total,
      priceCapCents: priceCapCents ?? undefined,
      warnings,
      status,
    });
  }

  return { lines: results, disclaimer: NDIS_DISCLAIMER, totalCents };
}
