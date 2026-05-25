import type Stripe from "stripe";

import { markInvoicePaidFromStripe } from "@/lib/stripe/stripe-checkout-service";
import { parseAndProcessWebhookRequest } from "@/lib/stripe/webhooks";
import { legacyInvoiceIdFromMetadata } from "@/lib/stripe/metadata";
import { prisma } from "@/lib/prisma";
import { recordBillingEvent } from "@/lib/billing/invoice-event-service";

export { parseAndProcessWebhookRequest, constructStripeWebhookEvent } from "@/lib/stripe/webhooks";

export async function handleBillingStripePaymentEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(session);
      break;
    }
    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;
      await handlePaymentIntentSucceeded(pi);
      break;
    }
    case "payment_intent.payment_failed": {
      const pi = event.data.object as Stripe.PaymentIntent;
      await handlePaymentIntentFailed(pi);
      break;
    }
    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      await handleChargeRefunded(charge);
      break;
    }
    case "invoice.paid":
    case "invoice.payment_failed":
      break;
    default:
      break;
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const invoiceId = legacyInvoiceIdFromMetadata(session.metadata);
  if (!invoiceId) return;

  const piId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  await prisma.stripePaymentRecord.updateMany({
    where: { stripeCheckoutSessionId: session.id },
    data: {
      stripePaymentIntentId: piId ?? undefined,
      status: "succeeded",
      paidAt: new Date(),
    },
  });

  if (piId) {
    await markInvoicePaidFromStripe(
      invoiceId,
      piId,
      session.amount_total ?? 0
    );
  }
}

async function handlePaymentIntentSucceeded(pi: Stripe.PaymentIntent) {
  const invoiceId = legacyInvoiceIdFromMetadata(pi.metadata);
  if (!invoiceId) return;
  await markInvoicePaidFromStripe(invoiceId, pi.id, pi.amount);
}

async function handlePaymentIntentFailed(pi: Stripe.PaymentIntent) {
  const invoiceId = legacyInvoiceIdFromMetadata(pi.metadata);
  if (!invoiceId) return;

  await prisma.stripePaymentRecord.updateMany({
    where: { invoiceId },
    data: { status: "failed", failureReason: pi.last_payment_error?.message },
  });

  await recordBillingEvent({
    invoiceId,
    eventType: "payment_pending",
    message: pi.last_payment_error?.message ?? "Payment failed",
    auditAction: "stripe.payment_failed",
  });
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const piId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;
  if (!piId) return;

  const record = await prisma.stripePaymentRecord.findFirst({
    where: { stripePaymentIntentId: piId },
  });
  if (!record) return;

  await prisma.stripePaymentRecord.update({
    where: { id: record.id },
    data: { status: "refunded" },
  });

  await prisma.invoice.update({
    where: { id: record.invoiceId },
    data: { status: "refunded" },
  });

  await recordBillingEvent({
    invoiceId: record.invoiceId,
    eventType: "refunded",
    toStatus: "refunded",
    auditAction: "stripe.refunded",
  });
}
