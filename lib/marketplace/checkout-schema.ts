import { z } from "zod";

/**
 * Marketplace cart checkout accepts product IDs and quantities only.
 * Amounts are resolved server-side from the trusted catalogue.
 * `.strict()` rejects client-supplied amounts (price tampering).
 */
export const marketplaceCheckoutItemSchema = z
  .object({
    productId: z.string().min(1).max(80),
    quantity: z.number().int().positive().max(99),
  })
  .strict();

export const marketplaceCheckoutPathwaySchema = z.enum([
  /** Ordinary private card / self-pay purchase. */
  "ordinary_purchase",
  /** NDIS self-managed — card checkout allowed; does not imply plan eligibility. */
  "ndis_self_managed",
  /** Plan-managed — invoice + export only; never Stripe Checkout. */
  "ndis_plan_managed",
]);

export const marketplaceCheckoutSchema = z
  .object({
    items: z.array(marketplaceCheckoutItemSchema).min(1).max(50),
    pathway: marketplaceCheckoutPathwaySchema.default("ordinary_purchase"),
    /** Optional existing funding source; must belong to the caller when provided. */
    fundingSourceId: z.string().cuid().optional(),
  })
  .strict();

export type MarketplaceCheckoutInput = z.infer<typeof marketplaceCheckoutSchema>;
export type MarketplaceCheckoutPathway = z.infer<
  typeof marketplaceCheckoutPathwaySchema
>;
