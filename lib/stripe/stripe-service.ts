import { phase2Config, isStripeConfigured } from "@/lib/config/phase2";
import { prisma } from "@/lib/prisma";

export function stripeNotConfiguredResponse() {
  return {
    configured: false,
    message: "Payments not configured",
  };
}

export async function createPaymentIntentPlaceholder(params: {
  invoiceId: string;
  amountCents: number;
  userId: string;
}) {
  if (!isStripeConfigured()) {
    return { ok: false as const, ...stripeNotConfiguredResponse() };
  }

  // Phase 2: record intent placeholder without calling Stripe SDK unless installed
  const record = await prisma.stripePaymentIntentRecord.create({
    data: {
      invoiceId: params.invoiceId,
      stripePaymentIntentId: `pi_placeholder_${Date.now()}`,
      amountCents: params.amountCents,
      currency: phase2Config.stripeDefaultCurrency,
      status: "requires_payment_method",
    },
  });

  await prisma.invoice.update({
    where: { id: params.invoiceId },
    data: { status: "stripe_payment_pending" },
  });

  return {
    ok: true as const,
    configured: true,
    paymentIntentId: record.stripePaymentIntentId,
    metadata: {
      mapable_invoice_id: params.invoiceId,
      payment_purpose: "private_pay_or_copay",
    },
  };
}

export async function processStripeWebhookEvent(
  stripeEventId: string,
  eventType: string,
  payload: unknown
) {
  const existing = await prisma.stripeWebhookEvent.findUnique({
    where: { stripeEventId },
  });
  if (existing?.processedAt) {
    return { duplicate: true };
  }

  await prisma.stripeWebhookEvent.upsert({
    where: { stripeEventId },
    create: {
      stripeEventId,
      eventType,
      payload: payload as object,
      processedAt: new Date(),
    },
    update: { processedAt: new Date(), eventType },
  });

  return { duplicate: false };
}
