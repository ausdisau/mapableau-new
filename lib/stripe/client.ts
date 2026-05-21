import Stripe from "stripe";

/** Pinned Stripe API version — keep in sync with Stripe dashboard/webhook version */
const STRIPE_API_VERSION = "2026-04-22.dahlia";

function getStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return key;
}

let stripeClient: Stripe | null = null;

/**
 * Server-only Stripe client. Never import this module from client components.
 */
export function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(getStripeSecretKey(), {
      apiVersion: STRIPE_API_VERSION,
      typescript: true,
    });
  }
  return stripeClient;
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
