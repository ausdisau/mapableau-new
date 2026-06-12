import { getStripeClient } from "@/lib/stripe/client";
import { stripeConfig } from "@/lib/stripe/config";

export async function createBillingPortalSession(params: {
  stripeCustomerId: string;
  returnUrl?: string;
}) {
  const stripe = getStripeClient();
  return stripe.billingPortal.sessions.create({
    customer: params.stripeCustomerId,
    return_url: params.returnUrl ?? `${stripeConfig.appUrl}/dashboard/billing/invoices`,
  });
}
