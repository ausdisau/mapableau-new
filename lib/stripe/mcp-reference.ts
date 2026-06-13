import type { BillingFundingSourceType } from "@prisma/client";

import {
  checkoutDecisionForFundingType,
  stripeCheckoutAllowed,
} from "@/lib/billing-core/funding-logic";
import { STRIPE_API_VERSION } from "@/lib/stripe/client";
import {
  isStripeIntegrationEnabled,
  isStripeSdkAvailable,
  priceIdForSubscriptionPlan,
  stripeConfig,
} from "@/lib/stripe/config";
import {
  billingCheckoutMetadata,
  legacyInvoiceMetadata,
} from "@/lib/stripe/metadata";

/** Governance rules for agents using Stripe MCP tools. */
export const STRIPE_MCP_GOVERNANCE = {
  version: "1.0.0",
  name: "mapable-stripe",
  humanInTheLoop: [
    "Never create Checkout sessions, PaymentIntents, refunds, or Connect accounts via MCP without explicit user approval.",
    "Never treat redirect URLs or client-side success pages as payment confirmation — webhooks are the source of truth.",
    "Plan-managed NDIS invoices must be exported to plan managers, not paid via Stripe Checkout.",
    "Do not embed STRIPE_SECRET_KEY or webhook secrets in prompts or tool arguments.",
  ],
  nonGoals: [
    "Direct card capture or storing PAN/CVV locally (use Stripe-hosted Checkout and Billing Portal).",
    "Bypassing MapAble billing-core audit logs and Prisma invoice state.",
    "Autonomous refunds or dispute responses without human review.",
  ],
  documentation: "docs/billing.md",
  libraryRoot: "lib/stripe/",
} as const;

export const BILLING_FUNDING_SOURCE_TYPES = [
  "ndis_plan_managed",
  "ndis_self_managed",
  "private_card",
  "organisation_invoice",
  "grant",
  "other",
] as const satisfies readonly BillingFundingSourceType[];

export type BillingFundingSourceTypeLiteral =
  (typeof BILLING_FUNDING_SOURCE_TYPES)[number];

export function getStripeConfigurationStatus() {
  const sdkAvailable = isStripeSdkAvailable();
  const integrationEnabled = isStripeIntegrationEnabled();

  return {
    sdkAvailable,
    integrationEnabled,
    legacyRoutesEnabled: integrationEnabled,
    billingCoreEnabled: sdkAvailable,
    apiVersion: STRIPE_API_VERSION,
    defaultCurrency: stripeConfig.defaultCurrency,
    appUrl: stripeConfig.appUrl,
    env: {
      STRIPE_SECRET_KEY: sdkAvailable ? "set" : "missing",
      STRIPE_WEBHOOK_SECRET: stripeConfig.webhookSecret ? "set" : "missing",
      STRIPE_CONNECT_CLIENT_ID: stripeConfig.connectClientId ? "set" : "missing",
      STRIPE_PROVIDER_PRO_PRICE_ID: stripeConfig.providerProPriceId ? "set" : "missing",
      STRIPE_EMPLOYER_PRO_PRICE_ID: stripeConfig.employerProPriceId ? "set" : "missing",
      BILLING_ENABLE_STRIPE:
        process.env.BILLING_ENABLE_STRIPE === "true" ? "true" : "unset",
      STRIPE_ENABLED: process.env.STRIPE_ENABLED === "true" ? "true" : "unset",
    },
    subscriptionPriceIds: {
      provider_pro: priceIdForSubscriptionPlan("provider_pro"),
      employer_pro: priceIdForSubscriptionPlan("employer_pro"),
    },
    message: sdkAvailable
      ? "Stripe SDK ready. Billing-core routes work with STRIPE_SECRET_KEY alone; legacy routes also require BILLING_ENABLE_STRIPE or STRIPE_ENABLED."
      : "Stripe not configured. Set STRIPE_SECRET_KEY in the host environment (.env via envFile).",
  };
}

export function evaluateFundingCheckout(
  fundingType: BillingFundingSourceTypeLiteral | null | undefined
) {
  const decision = checkoutDecisionForFundingType(fundingType);
  return {
    fundingType: fundingType ?? null,
    stripeCheckoutAllowed: stripeCheckoutAllowed(fundingType),
    decision,
  };
}

export function buildCheckoutMetadataPreview(params: {
  mode: "billing" | "legacy";
  invoiceId: string;
  userId: string;
  serviceType?: string;
  bookingId?: string;
  purpose?:
    | "participant_private_pay"
    | "participant_copay"
    | "provider_subscription"
    | "employer_subscription"
    | "other";
}) {
  if (params.mode === "billing") {
    return billingCheckoutMetadata({
      invoiceId: params.invoiceId,
      userId: params.userId,
      serviceType: params.serviceType,
      bookingId: params.bookingId,
    });
  }

  return legacyInvoiceMetadata({
    invoiceId: params.invoiceId,
    userId: params.userId,
    purpose: params.purpose ?? "other",
  });
}

export const MAPABLE_BILLING_API_ENDPOINTS = [
  { method: "GET", path: "/api/billing/funding-sources" },
  { method: "POST", path: "/api/billing/funding-sources" },
  { method: "GET", path: "/api/billing/invoices" },
  { method: "POST", path: "/api/billing/invoices" },
  { method: "POST", path: "/api/billing/checkout" },
  { method: "POST", path: "/api/billing/connect/create-account" },
  { method: "POST", path: "/api/billing/connect/onboarding-link" },
  { method: "POST", path: "/api/billing/subscriptions/checkout" },
  { method: "POST", path: "/api/billing/customer-portal" },
  { method: "POST", path: "/api/billing/invoices/export" },
  { method: "POST", path: "/api/webhooks/stripe" },
  { method: "GET", path: "/api/admin/billing/invoices" },
] as const;

export function mapableBillingApiReference(baseUrl?: string | null) {
  return {
    baseUrl: baseUrl ?? stripeConfig.appUrl,
    authNote:
      "Use session cookies or service credentials from the host environment; never embed secrets in prompts.",
    endpoints: MAPABLE_BILLING_API_ENDPOINTS,
    ui: [
      "/dashboard/billing",
      "/dashboard/billing/invoices",
      "/dashboard/billing/funding",
      "/provider/billing",
      "/admin/billing",
    ],
    webhookEvents: [
      "checkout.session.completed",
      "checkout.session.expired",
      "payment_intent.succeeded",
      "payment_intent.payment_failed",
      "charge.refunded",
      "charge.dispute.created",
      "invoice.paid",
      "customer.subscription.updated",
      "account.updated",
    ],
  };
}
