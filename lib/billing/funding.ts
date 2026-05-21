import type { FundingSourceType } from "@prisma/client";

export const STRIPE_CHECKOUT_FUNDING_TYPES: FundingSourceType[] = [
  "ndis_self_managed",
  "private_card",
];

export const PLAN_MANAGED_FUNDING_TYPES: FundingSourceType[] = [
  "ndis_plan_managed",
];

export function requiresStripeCheckout(
  fundingSourceType: FundingSourceType | null | undefined
): boolean {
  if (!fundingSourceType) return false;
  return STRIPE_CHECKOUT_FUNDING_TYPES.includes(fundingSourceType);
}

export function isPlanManagedFunding(
  fundingSourceType: FundingSourceType | null | undefined
): boolean {
  if (!fundingSourceType) return false;
  return PLAN_MANAGED_FUNDING_TYPES.includes(fundingSourceType);
}

export function blocksStripeCheckout(
  fundingSourceType: FundingSourceType | null | undefined
): boolean {
  return isPlanManagedFunding(fundingSourceType);
}

export type CheckoutDecision =
  | { action: "stripe_checkout" }
  | {
      action: "plan_manager_export";
      message: string;
    }
  | { action: "unsupported"; message: string };

export function resolveCheckoutDecision(
  fundingSourceType: FundingSourceType | null | undefined
): CheckoutDecision {
  if (isPlanManagedFunding(fundingSourceType)) {
    return {
      action: "plan_manager_export",
      message:
        "This invoice uses NDIS plan-managed funding. Export or send the invoice to your plan manager instead of paying by card.",
    };
  }

  if (requiresStripeCheckout(fundingSourceType)) {
    return { action: "stripe_checkout" };
  }

  return {
    action: "unsupported",
    message:
      "This funding source does not support Stripe Checkout. Use invoice export or contact support.",
  };
}
