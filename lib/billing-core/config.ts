export const billingCoreConfig = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  stripeConnectClientId: process.env.STRIPE_CONNECT_CLIENT_ID,
  providerProPriceId: process.env.STRIPE_PROVIDER_PRO_PRICE_ID,
  employerProPriceId: process.env.STRIPE_EMPLOYER_PRO_PRICE_ID,
  defaultCurrency: process.env.STRIPE_DEFAULT_CURRENCY ?? "AUD",
  /** Platform fee as basis points (1000 = 10%). */
  platformFeeBps: Number(process.env.BILLING_PLATFORM_FEE_BPS ?? "1000"),
  gstBps: Number(process.env.BILLING_GST_BPS ?? "1000"),
};

export function isBillingStripeConfigured(): boolean {
  return Boolean(billingCoreConfig.stripeSecretKey);
}

export function priceIdForPlan(
  planCode: "provider_pro" | "employer_pro" | "marketplace_featured" | "other"
): string | null {
  switch (planCode) {
    case "provider_pro":
      return billingCoreConfig.providerProPriceId ?? null;
    case "employer_pro":
      return billingCoreConfig.employerProPriceId ?? null;
    default:
      return null;
  }
}
