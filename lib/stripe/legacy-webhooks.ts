import type { BillingStripeWebhookProcessingStatus } from "@prisma/client";
import type Stripe from "stripe";

import { assertLivemodeMatches } from "@/lib/billing/core/webhook-livemode";
import { prisma } from "@/lib/prisma";
import { legacyInvoiceIdFromMetadata } from "@/lib/stripe/metadata";

const CLAIM_TTL_MS = 5 * 60 * 1000;

export async function storeLegacyWebhookEventIdempotent(
  stripeEventId: string,
  eventType: string,
  payload: object,
): Promise<{
  duplicate: boolean;
  processingStatus: BillingStripeWebhookProcessingStatus;
}> {
  const now = new Date();
  const existing = await prisma.stripeWebhookEvent.findUnique({
    where: { stripeEventId },
  });

  if (existing?.processedAt || existing?.processingStatus === "processed") {
    return {
      duplicate: true,
      processingStatus: existing.processingStatus ?? "processed",
    };
  }

  if (
    existing?.processingStatus === "processing" &&
    existing.claimExpiresAt &&
    existing.claimExpiresAt.getTime() > now.getTime()
  ) {
    return { duplicate: true, processingStatus: "processing" };
  }

  const claimExpiresAt = new Date(now.getTime() + CLAIM_TTL_MS);
  const row = await prisma.stripeWebhookEvent.upsert({
    where: { stripeEventId },
    create: {
      stripeEventId,
      eventType,
      payload,
      processedAt: null,
      processingStatus: "processing",
      attemptCount: 1,
      claimedAt: now,
      claimExpiresAt,
      lastError: null,
    },
    update: {
      eventType,
      payload,
      processedAt: null,
      processingStatus: "processing",
      attemptCount: { increment: 1 },
      claimedAt: now,
      claimExpiresAt,
      lastError: null,
    },
  });

  return { duplicate: false, processingStatus: row.processingStatus };
}

export async function markLegacyWebhookProcessed(stripeEventId: string) {
  await prisma.stripeWebhookEvent.update({
    where: { stripeEventId },
    data: {
      processedAt: new Date(),
      processingStatus: "processed",
      lastError: null,
      claimedAt: null,
      claimExpiresAt: null,
    },
  });
}

export async function markLegacyWebhookFailed(
  stripeEventId: string,
  error: unknown,
) {
  const message =
    error instanceof Error ? error.message.slice(0, 2000) : String(error).slice(0, 2000);
  await prisma.stripeWebhookEvent.update({
    where: { stripeEventId },
    data: {
      processedAt: null,
      processingStatus: "failed",
      lastError: message,
      claimedAt: null,
      claimExpiresAt: null,
    },
  });
}

export async function markLegacyWebhookQuarantined(
  stripeEventId: string,
  error: unknown,
) {
  const message =
    error instanceof Error ? error.message.slice(0, 2000) : String(error).slice(0, 2000);
  await prisma.stripeWebhookEvent.update({
    where: { stripeEventId },
    data: {
      processedAt: null,
      processingStatus: "quarantined",
      lastError: message,
      claimedAt: null,
      claimExpiresAt: null,
    },
  });
}

export async function handleLegacyStripeEvent(event: Stripe.Event) {
  assertLivemodeMatches(event);

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleLegacyCheckoutCompleted(session);
      break;
    }
    case "checkout.session.async_payment_failed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleLegacyCheckoutFailed(session);
      break;
    }
    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;
      await handleLegacyPaymentIntentSucceeded(pi);
      break;
    }
    case "payment_intent.payment_failed": {
      const pi = event.data.object as Stripe.PaymentIntent;
      await handleLegacyPaymentIntentFailed(pi);
      break;
    }
    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      await handleLegacyChargeRefunded(charge);
      break;
    }
    default:
      break;
  }
}

async function handleLegacyCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.metadata?.invoiceId) return;

  const invoiceId = legacyInvoiceIdFromMetadata(session.metadata);
  if (!invoiceId) return;

  await prisma.stripeCheckoutSessionRecord.updateMany({
    where: { stripeSessionId: session.id },
    data: { status: "complete" },
  });

  const piId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  if (piId) {
    await prisma.stripePaymentIntentRecord.updateMany({
      where: { invoiceId },
      data: { stripePaymentIntentId: piId, status: "succeeded" },
    });
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { status: true },
  });
  if (invoice?.status === "paid") return;

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "paid" },
  });
}

async function handleLegacyCheckoutFailed(session: Stripe.Checkout.Session) {
  const invoiceId = legacyInvoiceIdFromMetadata(session.metadata);
  if (!invoiceId) return;

  await prisma.stripeCheckoutSessionRecord.updateMany({
    where: { stripeSessionId: session.id },
    data: { status: "failed" },
  });
}

async function handleLegacyPaymentIntentSucceeded(pi: Stripe.PaymentIntent) {
  const invoiceId = legacyInvoiceIdFromMetadata(pi.metadata);
  if (!invoiceId) return;

  await prisma.stripePaymentIntentRecord.updateMany({
    where: { stripePaymentIntentId: pi.id },
    data: { status: "succeeded" },
  });

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { status: true },
  });
  if (invoice?.status === "paid") return;

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "paid" },
  });
}

async function handleLegacyPaymentIntentFailed(pi: Stripe.PaymentIntent) {
  const invoiceId = legacyInvoiceIdFromMetadata(pi.metadata);
  if (!invoiceId) return;

  await prisma.stripePaymentIntentRecord.updateMany({
    where: { stripePaymentIntentId: pi.id },
    data: { status: "failed" },
  });
}

async function handleLegacyChargeRefunded(charge: Stripe.Charge) {
  const piId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;
  if (!piId) return;

  const record = await prisma.stripePaymentIntentRecord.findFirst({
    where: { stripePaymentIntentId: piId },
  });
  if (!record) return;

  await prisma.stripePaymentIntentRecord.update({
    where: { id: record.id },
    data: { status: "refunded" },
  });
}
