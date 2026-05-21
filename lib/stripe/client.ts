import Stripe from "stripe";

import { billingCoreConfig, isBillingStripeConfigured } from "@/lib/billing-core/config";

/** Pinned Stripe API version for MapAble Core billing. */
export const STRIPE_API_VERSION = "2026-04-22.dahlia" as const;

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!isBillingStripeConfigured()) {
    throw new Error("STRIPE_NOT_CONFIGURED");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(billingCoreConfig.stripeSecretKey!, {
      apiVersion: STRIPE_API_VERSION,
      typescript: true,
    });
  }
  return stripeClient;
}

export function resetStripeClientForTests() {
  stripeClient = null;
}
