import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { isBillingStripeConfigured } from "@/lib/billing-core/config";
import { stripeConfig, stripeNotConfiguredResponse } from "@/lib/stripe/config";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const configured = isBillingStripeConfigured();
  const notConfigured = stripeNotConfiguredResponse();

  return jsonOk({
    stripe: {
      configured,
      checkoutAvailable: configured,
      webhookConfigured: Boolean(stripeConfig.webhookSecret),
      currency: stripeConfig.defaultCurrency.toUpperCase(),
      appUrl: stripeConfig.appUrl,
      providerProPriceConfigured: Boolean(stripeConfig.providerProPriceId),
      employerProPriceConfigured: Boolean(stripeConfig.employerProPriceId),
      connectConfigured: Boolean(stripeConfig.connectClientId),
      integrationFlags: {
        stripeEnabled: process.env.STRIPE_ENABLED === "true",
        billingEnableStripe: process.env.BILLING_ENABLE_STRIPE === "true",
      },
      ...(configured
        ? {}
        : {
            message: notConfigured.message,
            setupDocPath: "/docs/stripe-checkout.md",
          }),
    },
    projectsNote:
      "Stripe API keys are not provisioned via Stripe Projects (projects.dev). Configure keys in the Stripe Dashboard.",
  });
}
