import { createHash } from "crypto";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { amountDueForStripe } from "@/lib/billing/invoice-total-service";
import { recordBillingEvent } from "@/lib/billing/invoice-event-service";
import { isStripeIntegrationEnabled } from "@/lib/stripe/config";
import { createStripePaymentCheckoutSession } from "@/lib/stripe/checkout";
import { ensureLegacyStripeCustomer } from "@/lib/stripe/customers";
import { legacyInvoiceMetadata } from "@/lib/stripe/metadata";
import { stripeConfig } from "@/lib/stripe/config";
import { prisma } from "@/lib/prisma";

export async function createCheckoutSessionForInvoice(params: {
  invoiceId: string;
  userId: string;
  amountCents?: number;
  successPath?: string;
  cancelPath?: string;
}) {
  if (!isStripeIntegrationEnabled()) {
    return { ok: false as const, message: "Stripe is not configured" };
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.invoiceId },
    include: { lines: true },
  });
  if (!invoice) throw new Error("INVOICE_NOT_FOUND");

  const amountCents =
    params.amountCents ?? amountDueForStripe(invoice);
  if (amountCents <= 0) throw new Error("INVALID_PAYMENT_AMOUNT");

  const customerId = await ensureLegacyStripeCustomer(params.userId);
  const idempotencyKey = createHash("sha256")
    .update(`${params.invoiceId}:${amountCents}:${Date.now()}`)
    .digest("hex")
    .slice(0, 32);

  const metadata = legacyInvoiceMetadata({
    invoiceId: params.invoiceId,
    userId: params.userId,
    purpose: "participant_private_pay",
  });

  const session = await createStripePaymentCheckoutSession({
    amountCents,
    customerId,
    productName: `Invoice ${invoice.invoiceNumber ?? params.invoiceId.slice(0, 8)}`,
    successUrl: `${stripeConfig.appUrl}${params.successPath ?? `/invoices/${params.invoiceId}?paid=1`}`,
    cancelUrl: `${stripeConfig.appUrl}${params.cancelPath ?? `/invoices/${params.invoiceId}?cancelled=1`}`,
    metadata,
  });

  await prisma.stripePaymentRecord.create({
    data: {
      invoiceId: params.invoiceId,
      stripeCheckoutSessionId: session.id,
      amountCents,
      currency: invoice.currency,
      status: "pending",
      idempotencyKey,
    },
  });

  await prisma.stripeCheckoutSessionRecord.create({
    data: {
      invoiceId: params.invoiceId,
      stripeSessionId: session.id,
      purpose: "participant_private_pay",
      amountCents,
      status: session.status ?? "open",
    },
  });

  await prisma.invoice.update({
    where: { id: params.invoiceId },
    data: { status: "payment_pending" },
  });

  await recordBillingEvent({
    invoiceId: params.invoiceId,
    eventType: "payment_pending",
    toStatus: "payment_pending",
    actorUserId: params.userId,
    participantId: invoice.participantId,
    auditAction: "stripe.checkout_created",
    metadata: { sessionId: session.id },
  });

  await createAuditEvent({
    actorUserId: params.userId,
    action: "stripe.checkout_session_created",
    entityType: "Invoice",
    entityId: params.invoiceId,
    metadata: { sessionId: session.id },
  });

  return {
    ok: true as const,
    sessionId: session.id,
    url: session.url,
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  };
}

export async function markInvoicePaidFromStripe(
  invoiceId: string,
  paymentIntentId: string,
  amountCents: number
) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) return;

  const isFull =
    amountCents >= (invoice.privatePayCents ?? invoice.totalCents);
  const newStatus = isFull ? "paid" : "partially_paid";

  await prisma.stripePaymentRecord.updateMany({
    where: { invoiceId },
    data: {
      stripePaymentIntentId: paymentIntentId,
      status: "succeeded",
      paidAt: new Date(),
    },
  });

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: newStatus, paidAt: new Date() },
  });

  await recordBillingEvent({
    invoiceId,
    eventType: isFull ? "paid" : "partially_paid",
    toStatus: newStatus,
    participantId: invoice.participantId,
    auditAction: "stripe.payment_succeeded",
    metadata: { paymentIntentId, amountCents },
  });
}
