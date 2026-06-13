import type { StripePaymentPurpose } from "@prisma/client";
import type Stripe from "stripe";

import { getStripeClient } from "@/lib/stripe/client";
import { stripeConfig } from "@/lib/stripe/config";
import { billingCheckoutMetadata, legacyInvoiceMetadata } from "@/lib/stripe/metadata";

export type PaymentCheckoutParams = {
  amountCents: number;
  currency?: string;
  customerId?: string;
  productName: string;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
  applicationFeeAmount?: number;
  transferDestination?: string;
};

export async function createStripePaymentCheckoutSession(
  params: PaymentCheckoutParams
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripeClient();
  const currency = (params.currency ?? stripeConfig.defaultCurrency).toLowerCase();

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency,
          unit_amount: params.amountCents,
          product_data: { name: params.productName },
        },
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: params.metadata,
  };

  if (params.customerId) {
    sessionParams.customer = params.customerId;
  }

  if (params.transferDestination && params.applicationFeeAmount !== undefined) {
    sessionParams.payment_intent_data = {
      application_fee_amount: params.applicationFeeAmount,
      transfer_data: { destination: params.transferDestination },
      metadata: params.metadata,
    };
  }

  return stripe.checkout.sessions.create(sessionParams);
}

export async function createStripeSubscriptionCheckoutSession(params: {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
}): Promise<Stripe.Checkout.Session> {
  const stripe = getStripeClient();
  return stripe.checkout.sessions.create({
    mode: "subscription",
    customer: params.customerId,
    line_items: [{ price: params.priceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: params.metadata,
  });
}

export function buildBillingPaymentCheckout(params: {
  invoiceId: string;
  userId: string;
  serviceType: string;
  bookingId?: string | null;
  totalCents: number;
  currency: string;
  customerId: string;
  productLabel: string;
  platformFeeCents?: number;
  providerConnectedAccountId?: string | null;
  successUrl?: string;
  cancelUrl?: string;
}) {
  const metadata = billingCheckoutMetadata({
    invoiceId: params.invoiceId,
    userId: params.userId,
    serviceType: params.serviceType,
    bookingId: params.bookingId ?? undefined,
  });

  return createStripePaymentCheckoutSession({
    amountCents: params.totalCents,
    currency: params.currency,
    customerId: params.customerId,
    productName: params.productLabel,
    successUrl:
      params.successUrl ??
      `${stripeConfig.appUrl}/dashboard/billing/invoices?checkout=success&invoiceId=${params.invoiceId}`,
    cancelUrl:
      params.cancelUrl ??
      `${stripeConfig.appUrl}/dashboard/billing/invoices?checkout=cancelled&invoiceId=${params.invoiceId}`,
    metadata,
    applicationFeeAmount:
      params.providerConnectedAccountId && params.platformFeeCents !== undefined
        ? params.platformFeeCents
        : undefined,
    transferDestination: params.providerConnectedAccountId ?? undefined,
  });
}

export function buildLegacyInvoiceCheckout(params: {
  invoiceId: string;
  userId: string;
  amountCents: number;
  purpose: StripePaymentPurpose;
  customerId?: string;
}) {
  const metadata = legacyInvoiceMetadata({
    invoiceId: params.invoiceId,
    userId: params.userId,
    purpose: params.purpose,
  });

  return createStripePaymentCheckoutSession({
    amountCents: params.amountCents,
    customerId: params.customerId,
    productName: "MapAble invoice payment",
    successUrl: `${stripeConfig.appUrl}/dashboard/billing/legacy/${params.invoiceId}?checkout=success`,
    cancelUrl: `${stripeConfig.appUrl}/dashboard/billing/legacy/${params.invoiceId}?checkout=cancelled`,
    metadata,
  });
}
