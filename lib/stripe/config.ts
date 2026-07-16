/**
 * Unified Stripe configuration for MapAble Core.
 * Set STRIPE_SECRET_KEY (and STRIPE_WEBHOOK_SECRET for webhooks).
 * Legacy routes also honour BILLING_ENABLE_STRIPE or STRIPE_ENABLED.
 */
export const stripeConfig = {
  secretKey: process.env.STRIPE_SECRET_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  connectClientId: process.env.STRIPE_CONNECT_CLIENT_ID,
  providerProPriceId: process.env.STRIPE_PROVIDER_PRO_PRICE_ID,
  employerProPriceId: process.env.STRIPE_EMPLOYER_PRO_PRICE_ID,
  /** Access Intelligence / Verify — only used when explicitly configured (test mode). */
  aiVerifyStarterPriceId: process.env.STRIPE_AI_VERIFY_STARTER_PRICE_ID,
  aiVerifyOperationsPriceId: process.env.STRIPE_AI_VERIFY_OPERATIONS_PRICE_ID,
  aiVerifyPortfolioPriceId: process.env.STRIPE_AI_VERIFY_PORTFOLIO_PRICE_ID,
  aiLearningOrganisationPriceId: process.env.STRIPE_AI_LEARNING_ORGANISATION_PRICE_ID,
  aiEnterprisePriceId: process.env.STRIPE_AI_ENTERPRISE_PRICE_ID,
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  defaultCurrency: (process.env.STRIPE_DEFAULT_CURRENCY ?? "AUD").toLowerCase(),
};

/** True when the secret key is present (billing-core and SDK calls). */
export function isStripeSdkAvailable(): boolean {
  return Boolean(stripeConfig.secretKey);
}

/** Legacy phase-2/5 gate: requires env flag plus secret key. */
export function isStripeIntegrationEnabled(): boolean {
  if (!stripeConfig.secretKey) return false;
  return (
    process.env.BILLING_ENABLE_STRIPE === "true" ||
    process.env.STRIPE_ENABLED === "true"
  );
}

export function stripeNotConfiguredResponse() {
  return {
    configured: false,
    message:
      "Payments not configured. Set STRIPE_SECRET_KEY and enable BILLING_ENABLE_STRIPE or STRIPE_ENABLED.",
  };
}

export type SubscriptionPlanCode =
  | "provider_pro"
  | "employer_pro"
  | "marketplace_featured"
  | "other"
  | "ai_verify_starter"
  | "ai_verify_operations"
  | "ai_verify_portfolio"
  | "ai_learning_organisation"
  | "ai_enterprise";

export function priceIdForSubscriptionPlan(
  planCode: SubscriptionPlanCode,
): string | null {
  switch (planCode) {
    case "provider_pro":
      return stripeConfig.providerProPriceId ?? null;
    case "employer_pro":
      return stripeConfig.employerProPriceId ?? null;
    case "ai_verify_starter":
      return stripeConfig.aiVerifyStarterPriceId ?? null;
    case "ai_verify_operations":
      return stripeConfig.aiVerifyOperationsPriceId ?? null;
    case "ai_verify_portfolio":
      return stripeConfig.aiVerifyPortfolioPriceId ?? null;
    case "ai_learning_organisation":
      return stripeConfig.aiLearningOrganisationPriceId ?? null;
    case "ai_enterprise":
      return stripeConfig.aiEnterprisePriceId ?? null;
    case "marketplace_featured":
    case "other":
      return null;
    default: {
      const _exhaustive: never = planCode;
      return _exhaustive;
    }
  }
}
