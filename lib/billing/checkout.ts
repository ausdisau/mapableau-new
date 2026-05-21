import type { Invoice, FundingSource } from "@prisma/client";

import { blocksStripeCheckout } from "@/lib/billing/funding";
import { prisma } from "@/lib/prisma";
import { getStripe, getAppUrl } from "@/lib/stripe/client";

type InvoiceForCheckout = Invoice & {
  fundingSource: FundingSource | null;
};

export function assertCheckoutAllowed(invoice: InvoiceForCheckout): void {
  if (blocksStripeCheckout(invoice.fundingSource?.type)) {
    throw new Error("PLAN_MANAGED_NO_STRIPE");
  }
}

export async function createInvoiceCheckoutSession(params: {
  invoice: InvoiceForCheckout;
  userId: string;
  userEmail: string;
  stripeCustomerId: string;
  providerConnectedAccountId?: string | null;
}) {
  const { invoice, userId, userEmail, stripeCustomerId, providerConnectedAccountId } =
    params;

  assertCheckoutAllowed(invoice);

  const stripe = getStripe();
  const appUrl = getAppUrl();

  const lineItems = [
    {
      price_data: {
        currency: invoice.currency.toLowerCase(),
        product_data: {
          name: `MapAble ${invoice.serviceType} invoice`,
          metadata: {
            invoiceId: invoice.id,
            serviceType: invoice.serviceType,
          },
        },
        unit_amount: invoice.totalCents,
      },
      quantity: 1,
    },
  ];

  const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
    mode: "payment",
    customer: stripeCustomerId,
    customer_email: stripeCustomerId ? undefined : userEmail,
    line_items: lineItems,
    success_url: `${appUrl}/billing?checkout=success&invoiceId=${invoice.id}`,
    cancel_url: `${appUrl}/billing?checkout=cancelled&invoiceId=${invoice.id}`,
    metadata: {
      invoiceId: invoice.id,
      userId,
      bookingId: invoice.bookingId ?? "",
      serviceType: invoice.serviceType,
    },
  };

  if (providerConnectedAccountId && invoice.platformFeeCents >= 0) {
    sessionParams.payment_intent_data = {
      application_fee_amount: invoice.platformFeeCents,
      transfer_data: {
        destination: providerConnectedAccountId,
      },
      metadata: {
        invoiceId: invoice.id,
        userId,
      },
    };
  }

  return stripe.checkout.sessions.create(sessionParams);
}

export function getSubscriptionPriceId(
  planCode: "provider_pro" | "employer_pro" | "marketplace_featured" | "other"
): string | null {
  switch (planCode) {
    case "provider_pro":
      return process.env.STRIPE_PROVIDER_PRO_PRICE_ID ?? null;
    case "employer_pro":
      return process.env.STRIPE_EMPLOYER_PRO_PRICE_ID ?? null;
    default:
      return null;
  }
}

export async function createSubscriptionCheckoutSession(params: {
  planCode: "provider_pro" | "employer_pro";
  userId: string;
  userEmail: string;
  stripeCustomerId: string;
  billingAccountId: string;
}) {
  const priceId = getSubscriptionPriceId(params.planCode);
  if (!priceId) {
    throw new Error("SUBSCRIPTION_PRICE_NOT_CONFIGURED");
  }

  const stripe = getStripe();
  const appUrl = getAppUrl();

  return stripe.checkout.sessions.create({
    mode: "subscription",
    customer: params.stripeCustomerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/provider/billing?subscription=success`,
    cancel_url: `${appUrl}/provider/billing?subscription=cancelled`,
    metadata: {
      userId: params.userId,
      billingAccountId: params.billingAccountId,
      planCode: params.planCode,
    },
    subscription_data: {
      metadata: {
        userId: params.userId,
        billingAccountId: params.billingAccountId,
        planCode: params.planCode,
      },
    },
  });
}

export async function createConnectAccount(userEmail: string) {
  const stripe = getStripe();
  return stripe.accounts.create({
    type: "express",
    country: "AU",
    email: userEmail,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: { platform: "mapable" },
  });
}

export async function createConnectOnboardingLink(
  connectedAccountId: string,
  returnPath = "/provider/billing"
) {
  const stripe = getStripe();
  const appUrl = getAppUrl();
  return stripe.accountLinks.create({
    account: connectedAccountId,
    refresh_url: `${appUrl}${returnPath}?onboarding=refresh`,
    return_url: `${appUrl}${returnPath}?onboarding=complete`,
    type: "account_onboarding",
  });
}

export async function getProviderConnectedAccountId(
  providerId: string | null | undefined,
  userId: string
): Promise<string | null> {
  if (!providerId) return null;

  const providerAccount = await prisma.billingAccount.findFirst({
    where: {
      role: "provider",
      stripeConnectedAccountId: { not: null },
      user: {
        memberships: { some: { providerId } },
      },
    },
    select: { stripeConnectedAccountId: true },
  });

  if (providerAccount?.stripeConnectedAccountId) {
    return providerAccount.stripeConnectedAccountId;
  }

  const ownAccount = await prisma.billingAccount.findUnique({
    where: { userId_role: { userId, role: "provider" } },
    select: { stripeConnectedAccountId: true },
  });

  return ownAccount?.stripeConnectedAccountId ?? null;
}
