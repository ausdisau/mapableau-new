/** Minimal pricing identity used on canonical claim lines (Wave 3 expands this). */
export type PricingUnit =
  | "hour"
  | "each"
  | "day"
  | "week"
  | "month"
  | "other";

export type PriceLimitRef = {
  supportItemCode: string;
  unit: PricingUnit | string | null;
  priceLimitCents: number | null;
  pricingReleaseId?: string | null;
  pricingRuleId?: string | null;
};
