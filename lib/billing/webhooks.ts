import type { PaymentMethod, PaymentStatus, SubscriptionStatus } from "@prisma/client";
import type Stripe from "stripe";

import { createAuditLog } from "@/lib/billing/audit";
import { prisma } from "@/lib/prisma";

export async function storeWebhookEvent(event: Stripe.Event): Promise<{
  isDuplicate: boolean;
  recordId: string;
}> {
  const existing = await prisma.stripeWebhookEvent.findUnique({
    where: { stripeEventId: event.id },
  });
  if (existing) {
    return { isDuplicate: true, recordId: existing.id };
  }

  const record = await prisma.stripeWebhookEvent.create({
    data: {
      stripeEventId: event.id,
      type: event.type,
      payload: event as object,
    },
  });
  return { isDuplicate: false, recordId: record.id };
}

export async function markWebhookProcessed(recordId: string) {
  await prisma.stripeWebhookEvent.update({
    where: { id: recordId },
    data: { processed: true, processedAt: new Date() },
  });
}

function mapSubscriptionStatus(
  stripeStatus: Stripe.Subscription.Status
): SubscriptionStatus {
  const map: Record<string, SubscriptionStatus> = {
    incomplete: "incomplete",
    incomplete_expired: "incomplete_expired",
    trialing: "trialing",
    active: "active",
    past_due: "past_due",
    canceled: "canceled",
    unpaid: "unpaid",
    paused: "paused",
  };
  return map[stripeStatus] ?? "incomplete";
}

async function updateInvoicePaymentSuccess(params: {
  invoiceId: string;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  amountCents: number;
  actorUserId?: string | null;
}) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.invoiceId },
  });
  if (!invoice) return;

  const beforeInvoice = { status: invoice.status };
  await prisma.invoice.update({
    where: { id: params.invoiceId },
    data: {
      status: "paid",
      paidAt: new Date(),
      stripeCheckoutSessionId:
        params.stripeCheckoutSessionId ?? invoice.stripeCheckoutSessionId,
      stripePaymentIntentId:
        params.stripePaymentIntentId ?? invoice.stripePaymentIntentId,
    },
  });

  await createAuditLog({
    actorUserId: params.actorUserId,
    entityType: "Invoice",
    entityId: params.invoiceId,
    action: "payment_succeeded",
    before: beforeInvoice,
    after: { status: "paid" },
  });

  const payment = await prisma.payment.findFirst({
    where: { invoiceId: params.invoiceId },
    orderBy: { createdAt: "desc" },
  });

  if (payment) {
    const beforePayment = { status: payment.status };
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "succeeded",
        paidAt: new Date(),
        stripeCheckoutSessionId:
          params.stripeCheckoutSessionId ?? payment.stripeCheckoutSessionId,
        stripePaymentIntentId:
          params.stripePaymentIntentId ?? payment.stripePaymentIntentId,
      },
    });
    await createAuditLog({
      actorUserId: params.actorUserId,
      entityType: "Payment",
      entityId: payment.id,
      action: "succeeded",
      before: beforePayment,
      after: { status: "succeeded" },
    });
  } else {
    await prisma.payment.create({
      data: {
        invoiceId: params.invoiceId,
        userId: invoice.userId,
        providerId: invoice.providerId,
        status: "succeeded",
        method: "stripe_checkout",
        amountCents: params.amountCents,
        currency: invoice.currency,
        stripeCheckoutSessionId: params.stripeCheckoutSessionId,
        stripePaymentIntentId: params.stripePaymentIntentId,
        paidAt: new Date(),
      },
    });
  }
}

async function updateInvoicePaymentFailed(params: {
  invoiceId: string;
  reason?: string;
}) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.invoiceId },
  });
  if (!invoice) return;

  await prisma.invoice.update({
    where: { id: params.invoiceId },
    data: { status: "failed" },
  });

  const payment = await prisma.payment.findFirst({
    where: { invoiceId: params.invoiceId },
    orderBy: { createdAt: "desc" },
  });

  if (payment) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "failed",
        failureReason: params.reason,
      },
    });
  }
}

export async function handleStripeWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      const invoiceId = session.metadata?.invoiceId;
      if (invoiceId && session.payment_status === "paid") {
        await updateInvoicePaymentSuccess({
          invoiceId,
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id,
          amountCents: session.amount_total ?? 0,
          actorUserId: session.metadata?.userId,
        });
      }
      break;
    }

    case "checkout.session.async_payment_failed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const invoiceId = session.metadata?.invoiceId;
      if (invoiceId) {
        await updateInvoicePaymentFailed({
          invoiceId,
          reason: "async_payment_failed",
        });
      }
      break;
    }

    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;
      const invoiceId = pi.metadata?.invoiceId;
      if (invoiceId) {
        await updateInvoicePaymentSuccess({
          invoiceId,
          stripePaymentIntentId: pi.id,
          amountCents: pi.amount_received,
          actorUserId: pi.metadata?.userId,
        });
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const pi = event.data.object as Stripe.PaymentIntent;
      const invoiceId = pi.metadata?.invoiceId;
      if (invoiceId) {
        await updateInvoicePaymentFailed({
          invoiceId,
          reason: pi.last_payment_error?.message,
        });
      }
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      const piId =
        typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : charge.payment_intent?.id;

      const payment = piId
        ? await prisma.payment.findFirst({
            where: { stripePaymentIntentId: piId },
          })
        : null;

      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "refunded" },
        });
        await prisma.invoice.update({
          where: { id: payment.invoiceId },
          data: { status: "refunded" },
        });
        await createAuditLog({
          entityType: "Payment",
          entityId: payment.id,
          action: "refunded",
          after: { status: "refunded" },
        });
      }
      break;
    }

    case "charge.dispute.created": {
      const dispute = event.data.object as Stripe.Dispute;
      const chargeId =
        typeof dispute.charge === "string"
          ? dispute.charge
          : dispute.charge?.id;

      const payment = chargeId
        ? await prisma.payment.findFirst({
            where: { stripeChargeId: chargeId },
          })
        : null;

      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "disputed" },
        });
        await createAuditLog({
          entityType: "Payment",
          entityId: payment.id,
          action: "disputed",
          after: { status: "disputed" },
        });
      }
      break;
    }

    case "invoice.paid":
    case "invoice.payment_failed": {
      // Stripe Billing invoice events (subscriptions) — logged for future AbilityPay
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription & {
        current_period_start: number;
        current_period_end: number;
      };
      const userId = sub.metadata?.userId;
      const billingAccountId = sub.metadata?.billingAccountId;
      const planCode = sub.metadata?.planCode as
        | "provider_pro"
        | "employer_pro"
        | undefined;

      if (!userId || !billingAccountId || !planCode) break;

      const status = mapSubscriptionStatus(sub.status);
      const priceId = sub.items.data[0]?.price?.id ?? "";

      await prisma.subscription.upsert({
        where: { stripeSubscriptionId: sub.id },
        create: {
          userId,
          billingAccountId,
          planCode,
          status,
          stripeCustomerId:
            typeof sub.customer === "string" ? sub.customer : sub.customer.id,
          stripeSubscriptionId: sub.id,
          stripePriceId: priceId,
          currentPeriodStart: new Date(sub.current_period_start * 1000),
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        },
        update: {
          status,
          stripePriceId: priceId,
          currentPeriodStart: new Date(sub.current_period_start * 1000),
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        },
      });

      await createAuditLog({
        actorUserId: userId,
        entityType: "Subscription",
        entityId: sub.id,
        action: event.type,
        after: { status },
      });
      break;
    }

    case "account.updated": {
      const account = event.data.object as Stripe.Account;
      if (!account.id) break;

      const billingAccount = await prisma.billingAccount.findFirst({
        where: { stripeConnectedAccountId: account.id },
      });
      if (!billingAccount) break;

      const complete =
        account.charges_enabled === true &&
        account.payouts_enabled === true &&
        account.details_submitted === true;

      const before = {
        connectOnboardingComplete: billingAccount.connectOnboardingComplete,
      };
      await prisma.billingAccount.update({
        where: { id: billingAccount.id },
        data: { connectOnboardingComplete: complete },
      });
      await createAuditLog({
        actorUserId: billingAccount.userId,
        entityType: "BillingAccount",
        entityId: billingAccount.id,
        action: "connect_onboarding_updated",
        before,
        after: { connectOnboardingComplete: complete },
      });
      break;
    }

    default:
      break;
  }
}

export async function createPendingPaymentForCheckout(params: {
  invoiceId: string;
  userId: string;
  providerId: string | null;
  amountCents: number;
  currency: string;
  stripeCheckoutSessionId: string;
  method?: PaymentMethod;
}) {
  return prisma.payment.create({
    data: {
      invoiceId: params.invoiceId,
      userId: params.userId,
      providerId: params.providerId,
      status: "requires_payment" as PaymentStatus,
      method: params.method ?? "stripe_checkout",
      amountCents: params.amountCents,
      currency: params.currency,
      stripeCheckoutSessionId: params.stripeCheckoutSessionId,
    },
  });
}

export async function createPaymentSplitsForInvoice(params: {
  paymentId: string;
  invoice: {
    providerId: string | null;
    platformFeeCents: number;
    totalCents: number;
  };
  providerConnectedAccountId?: string | null;
}) {
  const { paymentId, invoice, providerConnectedAccountId } = params;
  const providerAmount =
    invoice.totalCents - invoice.platformFeeCents;

  if (invoice.providerId && providerConnectedAccountId) {
    await prisma.paymentSplit.create({
      data: {
        paymentId,
        recipientType: "provider",
        recipientId: invoice.providerId,
        stripeConnectedAccountId: providerConnectedAccountId,
        amountCents: providerAmount,
        applicationFeeCents: invoice.platformFeeCents,
        status: "pending",
      },
    });
    await prisma.paymentSplit.create({
      data: {
        paymentId,
        recipientType: "mapable_platform",
        amountCents: invoice.platformFeeCents,
        applicationFeeCents: 0,
        status: "pending",
      },
    });
  } else if (invoice.providerId) {
    // Multi-provider or no Connect — stub splits for later transfer implementation
    await prisma.paymentSplit.create({
      data: {
        paymentId,
        recipientType: "provider",
        recipientId: invoice.providerId,
        amountCents: providerAmount,
        status: "pending",
      },
    });
  }
}
