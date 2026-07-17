import type { NdisPaymentRoute } from "@prisma/client";

export type PriceResolutionFailCode =
  | "PENDING_CODE_REFUSED"
  | "SUPPORT_ITEM_REQUIRED"
  | "CATALOGUE_ITEM_NOT_FOUND"
  | "CATALOGUE_ITEM_INACTIVE"
  | "OUTSIDE_EFFECTIVE_WINDOW"
  | "PRICE_LIMIT_MISSING"
  | "PROPOSED_PRICE_MISSING"
  | "ZERO_PRICE_NOT_ALLOWED"
  | "PRICE_ABOVE_LIMIT"
  | "NEGATIVE_PRICE";

export type AllowZeroPriceReason =
  | "pro_bono"
  | "grant_funded"
  | "explicit_zero_authorised";

export type ResolvePriceForServiceDateInput = {
  supportItemCode: string | null | undefined;
  serviceStartAt: Date | string;
  proposedUnitPriceCents: number | null | undefined;
  paymentRoute: NdisPaymentRoute | null;
  allowZeroPriceReason?: AllowZeroPriceReason | null;
};

export type PriceResolutionOk = {
  ok: true;
  supportItemCode: string;
  unitPriceCents: number;
  priceLimitCents: number | null;
  pricingRowId: string;
  pricingResolverVersion: string;
  provenance: {
    source: "ndis_pricing_catalogue_item";
    supportItemCode: string;
    pricingRowId: string;
    effectiveFrom: string | null;
    effectiveTo: string | null;
    priceLimitCents: number | null;
    proposedUnitPriceCents: number;
    resolvedUnitPriceCents: number;
    paymentRoute: NdisPaymentRoute | null;
    allowZeroPriceReason: AllowZeroPriceReason | null;
  };
};

export type PriceResolutionFail = {
  ok: false;
  code: PriceResolutionFailCode;
  message: string;
  /** Fail-closed: never invent a price. */
  unitPriceCents: null;
};

export type PriceResolutionResult = PriceResolutionOk | PriceResolutionFail;

export const PRICE_RESOLVER_VERSION = "wave4-bridge-1";
