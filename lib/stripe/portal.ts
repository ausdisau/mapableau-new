import { getStripeClient } from "@/lib/stripe/client";
import { stripeConfig } from "@/lib/stripe/config";

export async function createBillingPortalSession(
  stripeCustomerId: string,
  returnUrl?: string
) {
  const stripe = getStripeClient();
  return stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl ?? `${stripeConfig.appUrl}/dashboard/billing`,
  });
}
