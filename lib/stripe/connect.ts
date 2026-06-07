import { getStripeClient } from "@/lib/stripe/client";
import { stripeConfig } from "@/lib/stripe/config";

export async function createExpressConnectAccount(params: {
  userId: string;
  role: string;
}) {
  const stripe = getStripeClient();
  return stripe.accounts.create({
    type: "express",
    country: "AU",
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: { mapableUserId: params.userId, mapableRole: params.role },
  });
}

export async function retrieveConnectAccount(stripeAccountId: string) {
  const stripe = getStripeClient();
  return stripe.accounts.retrieve(stripeAccountId);
}

export async function createConnectOnboardingLink(stripeAccountId: string) {
  const stripe = getStripeClient();
  return stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: `${stripeConfig.appUrl}/provider/billing?onboarding=refresh`,
    return_url: `${stripeConfig.appUrl}/provider/billing?onboarding=complete`,
    type: "account_onboarding",
  });
}
