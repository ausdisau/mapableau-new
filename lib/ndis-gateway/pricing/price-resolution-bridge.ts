import { prisma } from "@/lib/prisma";
import {
  PRICE_RESOLVER_VERSION,
  type PriceResolutionResult,
  type ResolvePriceForServiceDateInput,
} from "@/lib/ndis-gateway/pricing/price-resolution-types";

const PENDING_CODE = "PENDING_CODE";

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function isWithinWindow(
  serviceAt: Date,
  effectiveFrom: Date | null,
  effectiveTo: Date | null
): boolean {
  if (effectiveFrom && serviceAt < effectiveFrom) return false;
  if (effectiveTo && serviceAt > effectiveTo) return false;
  return true;
}

/**
 * Wave 3 pricing bridge — catalogue lookup with service-date windows.
 * FAILS CLOSED: no PENDING_CODE, no silent zero, no invented prices.
 */
export async function resolvePriceForServiceDate(
  input: ResolvePriceForServiceDateInput
): Promise<PriceResolutionResult> {
  const code = input.supportItemCode?.trim() ?? "";
  if (!code) {
    return {
      ok: false,
      code: "SUPPORT_ITEM_REQUIRED",
      message: "A support item code is required before pricing can be resolved.",
      unitPriceCents: null,
    };
  }
  if (code.toUpperCase() === PENDING_CODE) {
    return {
      ok: false,
      code: "PENDING_CODE_REFUSED",
      message:
        "PENDING_CODE is not a billable support item. Resolve the real NDIS support item code first.",
      unitPriceCents: null,
    };
  }

  const proposed = input.proposedUnitPriceCents;
  if (proposed == null) {
    return {
      ok: false,
      code: "PROPOSED_PRICE_MISSING",
      message: "A proposed unit price in integer cents is required.",
      unitPriceCents: null,
    };
  }
  if (!Number.isInteger(proposed)) {
    return {
      ok: false,
      code: "PROPOSED_PRICE_MISSING",
      message: "Unit price must be integer cents.",
      unitPriceCents: null,
    };
  }
  if (proposed < 0) {
    return {
      ok: false,
      code: "NEGATIVE_PRICE",
      message: "Unit price cannot be negative.",
      unitPriceCents: null,
    };
  }
  if (proposed === 0 && !input.allowZeroPriceReason) {
    return {
      ok: false,
      code: "ZERO_PRICE_NOT_ALLOWED",
      message:
        "Zero unit price is refused unless an explicit allowZeroPriceReason is provided (fail closed).",
      unitPriceCents: null,
    };
  }

  const catalogue = await prisma.ndisPricingCatalogueItem.findUnique({
    where: { supportItemCode: code },
  });

  if (!catalogue) {
    return {
      ok: false,
      code: "CATALOGUE_ITEM_NOT_FOUND",
      message: `Support item ${code} was not found in the NDIS pricing catalogue.`,
      unitPriceCents: null,
    };
  }

  if (!catalogue.active) {
    return {
      ok: false,
      code: "CATALOGUE_ITEM_INACTIVE",
      message: `Support item ${code} is inactive in the pricing catalogue.`,
      unitPriceCents: null,
    };
  }

  const serviceAt = toDate(input.serviceStartAt);
  if (
    !isWithinWindow(serviceAt, catalogue.effectiveFrom, catalogue.effectiveTo)
  ) {
    return {
      ok: false,
      code: "OUTSIDE_EFFECTIVE_WINDOW",
      message: `Support item ${code} is not effective for the service date.`,
      unitPriceCents: null,
    };
  }

  // NDIS payment routes require a published price limit when becoming ready.
  if (
    input.paymentRoute != null &&
    catalogue.priceLimitCents == null
  ) {
    return {
      ok: false,
      code: "PRICE_LIMIT_MISSING",
      message: `No price limit is configured for support item ${code}. Pricing fails closed.`,
      unitPriceCents: null,
    };
  }

  if (
    catalogue.priceLimitCents != null &&
    proposed > catalogue.priceLimitCents
  ) {
    return {
      ok: false,
      code: "PRICE_ABOVE_LIMIT",
      message: `Proposed unit price exceeds the catalogue limit of ${catalogue.priceLimitCents} cents.`,
      unitPriceCents: null,
    };
  }

  return {
    ok: true,
    supportItemCode: code,
    unitPriceCents: proposed,
    priceLimitCents: catalogue.priceLimitCents,
    pricingRowId: catalogue.id,
    pricingResolverVersion: PRICE_RESOLVER_VERSION,
    provenance: {
      source: "ndis_pricing_catalogue_item",
      supportItemCode: code,
      pricingRowId: catalogue.id,
      effectiveFrom: catalogue.effectiveFrom?.toISOString() ?? null,
      effectiveTo: catalogue.effectiveTo?.toISOString() ?? null,
      priceLimitCents: catalogue.priceLimitCents,
      proposedUnitPriceCents: proposed,
      resolvedUnitPriceCents: proposed,
      paymentRoute: input.paymentRoute,
      allowZeroPriceReason: input.allowZeroPriceReason ?? null,
    },
  };
}
