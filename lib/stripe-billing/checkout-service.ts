import { createHash } from "crypto";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { phase5Config, integrationDisabledMessage } from "@/lib/config/phase5";
import { isStripeConfigured } from "@/lib/config/phase2";
import { prisma } from "@/lib/prisma";
import type { StripePaymentPurpose } from "@prisma/client";

export function safeStripeMetadata(params: {
  invoiceId?: string;
  userId?: string;
  purpose: StripePaymentPurpose;
}) {
  return {
    mapable_invoice_id: params.invoiceId ?? "",
    mapable_user_id: params.userId ?? "",
    payment_purpose: params.purpose,
  };
}

export async function createCheckoutForInvoice(params: {
  invoiceId: string;
  amountCents: number;
  userId: string;
  purpose: StripePaymentPurpose;
}) {
  if (!phase5Config.stripeEnabled || !isStripeConfigured()) {
    return { ok: false as const, ...integrationDisabledMessage("Stripe") };
  }

  const sessionId = `cs_placeholder_${Date.now()}`;
  const record = await prisma.stripeCheckoutSessionRecord.create({
    data: {
      invoiceId: params.invoiceId,
      stripeSessionId: sessionId,
      purpose: params.purpose,
      amountCents: params.amountCents,
      status: "open",
    },
  });

  await createAuditEvent({
    actorUserId: params.userId,
    action: "stripe.checkout_created",
    entityType: "Invoice",
    entityId: params.invoiceId,
  });

  return {
    ok: true as const,
    sessionId,
    record,
    metadata: safeStripeMetadata(params),
    url: `/dashboard/invoices/${params.invoiceId}/pay?session=${sessionId}`,
  };
}

export async function processStripeWebhookIdempotent(
  stripeEventId: string,
  eventType: string,
  payload: unknown
) {
  const existing = await prisma.stripeWebhookEvent.findUnique({
    where: { stripeEventId },
  });
  if (existing?.processedAt) return { duplicate: true };

  await prisma.stripeWebhookEvent.upsert({
    where: { stripeEventId },
    create: {
      stripeEventId,
      eventType,
      payload: payload as object,
      processedAt: new Date(),
    },
    update: { processedAt: new Date() },
  });

  return { duplicate: false };
}

export async function createRefundReview(
  paymentIntentId: string,
  amountCents: number,
  reason?: string
) {
  return prisma.stripeRefundRecord.create({
    data: {
      paymentIntentId,
      amountCents,
      status: "pending_review",
      reason,
    },
  });
}

export function hashApiKey(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}
