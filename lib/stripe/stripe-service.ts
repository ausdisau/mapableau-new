import type Stripe from "stripe";

import {
  isStripeIntegrationEnabled,
  stripeNotConfiguredResponse,
} from "@/lib/stripe/config";
import { createCheckoutForInvoice as createLegacyCheckoutForInvoice } from "@/lib/stripe-billing/checkout-service";
import {
  dispatchStripeWebhook,
  parseAndProcessWebhookRequest,
} from "@/lib/stripe/webhooks";

export { stripeNotConfiguredResponse, parseAndProcessWebhookRequest, dispatchStripeWebhook };

/** @deprecated Use createPaymentIntentForLegacyInvoice */
export async function createPaymentIntentPlaceholder(params: {
  invoiceId: string;
  amountCents: number;
  userId: string;
}) {
  if (!isStripeIntegrationEnabled()) {
    return { ok: false as const, ...stripeNotConfiguredResponse() };
  }

  // Wire legacy clients to Stripe Checkout while preserving route compatibility.
  const checkout = await createLegacyCheckoutForInvoice({
    invoiceId: params.invoiceId,
    amountCents: params.amountCents,
    userId: params.userId,
    purpose: "participant_private_pay",
  });

  if (!checkout.ok) {
    return checkout;
  }

  return {
    ok: true as const,
    configured: true as const,
    checkoutSessionId: checkout.sessionId,
    checkoutUrl: checkout.url,
    metadata: checkout.metadata,
  };
}

/** @deprecated Use dispatchStripeWebhook with a verified Stripe.Event */
export async function processStripeWebhookEvent(
  stripeEventId: string,
  eventType: string,
  payload: unknown
) {
  const event = {
    ...(payload as object),
    id: stripeEventId,
    type: eventType,
  } as Stripe.Event;

  const result = await dispatchStripeWebhook(event);
  return {
    duplicate: result.billing.duplicate || result.legacy.duplicate,
  };
}
