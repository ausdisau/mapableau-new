import type { BillingPayment, BillingPaymentMethod } from "@prisma/client";

import { getOrCreateBillingAccount } from "@/lib/billing/core/account-service";
import { writeBillingAuditLog } from "@/lib/billing/core/audit";
import { isBillingStripeConfigured } from "@/lib/billing/core/config";
import { checkoutDecisionForFundingType } from "@/lib/billing/core/funding-logic";
import { getInvoiceForUser, updateInvoiceStatus } from "@/lib/billing/core/invoice-service";
import { prisma } from "@/lib/prisma";
import { buildBillingPaymentCheckout } from "@/lib/stripe/checkout";
import { getStripeClient } from "@/lib/stripe/client";

type ReserveParams = {
  invoiceId: string;
  userId: string;
  providerId: string | null;
  amountCents: number;
  currency: string;
  transferGroup: string | null;
};

/**
 * Serialize checkout creation per invoice and reuse an in-flight payment row
 * (including rows that do not yet have a Stripe session id). Prevents two
 * overlapping requests from inserting distinct payments and opening two
 * payable Checkout Sessions for the same cart.
 */
async function reserveCheckoutPayment(
  params: ReserveParams,
): Promise<
  | { ok: true; payment: BillingPayment; created: boolean }
  | { ok: false; error: string }
> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      SELECT id FROM "BillingInvoice"
      WHERE id = ${params.invoiceId}
      FOR UPDATE
    `;

    const existing = await tx.billingPayment.findFirst({
      where: {
        invoiceId: params.invoiceId,
        userId: params.userId,
        status: { in: ["requires_payment", "processing", "succeeded"] },
      },
      orderBy: { createdAt: "desc" },
    });

    if (existing?.status === "succeeded") {
      return {
        ok: false as const,
        error: "Invoice payment already succeeded",
      };
    }

    if (existing) {
      return { ok: true as const, payment: existing, created: false };
    }

    const payment = await tx.billingPayment.create({
      data: {
        invoiceId: params.invoiceId,
        userId: params.userId,
        providerId: params.providerId,
        status: "requires_payment",
        method: "stripe_checkout" as BillingPaymentMethod,
        amountCents: params.amountCents,
        currency: params.currency,
        transferGroup: params.transferGroup ?? undefined,
      },
    });

    return { ok: true as const, payment, created: true };
  });
}

async function markPaymentFailed(paymentId: string, reason: string) {
  await prisma.billingPayment.update({
    where: { id: paymentId },
    data: { status: "failed", failureReason: reason },
  });
}

/**
 * Resolve a payment row that is safe to attach a *new* Checkout Session to:
 * either an open reusable session, a hard stop (complete/succeeded), or a
 * payment with no session id yet. Never returns a row whose existing session
 * is expired/dead — those are retired and replaced so Stripe idempotency keys
 * are not reused against a null-URL session.
 */
async function resolvePayablePayment(params: {
  stripe: ReturnType<typeof getStripeClient>;
  reserveParams: ReserveParams;
  initial: { payment: BillingPayment; created: boolean };
}): Promise<
  | {
      ok: true;
      payment: BillingPayment;
      checkoutUrl?: string;
      sessionId?: string;
      reused: boolean;
    }
  | { ok: false; error: string }
> {
  const { stripe, reserveParams } = params;
  let payment = params.initial.payment;
  let created = params.initial.created;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    if (!payment.stripeCheckoutSessionId) {
      if (!created) {
        // Peer may still be writing the session id — poll briefly.
        for (let poll = 0; poll < 8; poll += 1) {
          await new Promise((resolve) => setTimeout(resolve, 150));
          const refreshed = await prisma.billingPayment.findUnique({
            where: { id: payment.id },
          });
          if (refreshed?.stripeCheckoutSessionId) {
            payment = refreshed;
            break;
          }
          if (refreshed && refreshed.status !== "requires_payment") {
            return {
              ok: false,
              error: "Invoice payment already succeeded",
            };
          }
        }
      }

      if (!payment.stripeCheckoutSessionId) {
        return { ok: true, payment, reused: false };
      }
    }

    try {
      const existingSession = await stripe.checkout.sessions.retrieve(
        payment.stripeCheckoutSessionId,
      );
      if (existingSession.status === "open" && existingSession.url) {
        return {
          ok: true,
          payment,
          checkoutUrl: existingSession.url,
          sessionId: existingSession.id,
          reused: true,
        };
      }
      if (existingSession.status === "complete") {
        return {
          ok: false,
          error:
            "Checkout already completed for this invoice. Waiting for webhook confirmation — do not pay again.",
        };
      }

      await markPaymentFailed(
        payment.id,
        `replaced_after_session_${existingSession.status ?? "closed"}`,
      );
    } catch {
      // Unreadable/missing session — retire and replace; do not reuse this
      // payment id (Stripe may still honour its idempotency key).
      await markPaymentFailed(payment.id, "replaced_after_unreadable_session");
    }

    const reserved = await reserveCheckoutPayment(reserveParams);
    if (!reserved.ok) {
      return { ok: false, error: reserved.error };
    }
    payment = reserved.payment;
    created = reserved.created;
  }

  return {
    ok: false,
    error: "Could not obtain a usable Checkout Session for this invoice",
  };
}

export async function createCheckoutForInvoice(userId: string, invoiceId: string) {
  const invoice = await getInvoiceForUser(invoiceId, userId);
  if (!invoice) return { ok: false as const, error: "Invoice not found" };

  if (invoice.status === "paid" || invoice.status === "refunded") {
    return {
      ok: false as const,
      error: `Invoice is already ${invoice.status}`,
    };
  }

  const fundingType = invoice.fundingSource?.type;
  const decision = checkoutDecisionForFundingType(fundingType);
  if (!decision.allowed) {
    return { ok: false as const, decision };
  }

  if (!isBillingStripeConfigured()) {
    return {
      ok: false as const,
      error: "Stripe is not configured",
      configured: false,
    };
  }

  const stripe = getStripeClient();
  const reserveParams: ReserveParams = {
    invoiceId: invoice.id,
    userId,
    providerId: invoice.providerId,
    amountCents: invoice.totalCents,
    currency: invoice.currency,
    transferGroup: invoice.transferGroup,
  };

  const reserved = await reserveCheckoutPayment(reserveParams);
  if (!reserved.ok) {
    return { ok: false as const, error: reserved.error };
  }

  const resolved = await resolvePayablePayment({
    stripe,
    reserveParams,
    initial: reserved,
  });
  if (!resolved.ok) {
    return { ok: false as const, error: resolved.error };
  }

  if (resolved.checkoutUrl && resolved.sessionId) {
    return {
      ok: true as const,
      checkoutUrl: resolved.checkoutUrl,
      sessionId: resolved.sessionId,
      reused: true as const,
    };
  }

  const payment = resolved.payment;

  const account = await getOrCreateBillingAccount(userId, "participant");

  let customerId = account.stripeCustomerId;
  if (!customerId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const customer = await stripe.customers.create({
      email: user?.email,
      metadata: { mapableUserId: userId },
    });
    customerId = customer.id;
    await prisma.billingAccount.update({
      where: { id: account.id },
      data: { stripeCustomerId: customerId },
    });
  }

  let providerAccountId: string | null = null;
  if (invoice.providerId) {
    const providerAccount = await prisma.billingAccount.findFirst({
      where: {
        role: "provider",
        stripeConnectedAccountId: { not: null },
        user: {
          organisationMemberships: {
            some: { organisationId: invoice.providerId },
          },
        },
      },
    });
    providerAccountId = providerAccount?.stripeConnectedAccountId ?? null;
  }

  // Only reached for payments with no session id yet. Idempotency key is
  // payment-scoped so concurrent peers that share this row collapse in Stripe.
  const session = await buildBillingPaymentCheckout({
    invoiceId: invoice.id,
    userId,
    serviceType: invoice.serviceType,
    bookingId: invoice.bookingId,
    paymentId: payment.id,
    transferGroup: invoice.transferGroup ?? undefined,
    fundingSourceType: invoice.fundingSource?.type,
    totalCents: invoice.totalCents,
    currency: invoice.currency,
    customerId,
    productLabel: `MapAble ${invoice.serviceType} invoice`,
    platformFeeCents: invoice.platformFeeCents,
    providerConnectedAccountId: providerAccountId,
  });

  if (!session.url) {
    await markPaymentFailed(payment.id, "stripe_session_missing_url");
    return {
      ok: false as const,
      error: "Stripe Checkout Session did not return a URL",
    };
  }

  await prisma.billingPayment.update({
    where: { id: payment.id },
    data: { stripeCheckoutSessionId: session.id },
  });

  await updateInvoiceStatus(
    invoice.id,
    "pending_payment",
    { stripeCheckoutSessionId: session.id },
    userId,
  );

  await writeBillingAuditLog({
    actorUserId: userId,
    entityType: "BillingInvoice",
    entityId: invoice.id,
    action: "checkout_session_created",
    after: { stripeCheckoutSessionId: session.id },
  });

  return {
    ok: true as const,
    checkoutUrl: session.url,
    sessionId: session.id,
    reused: false as const,
  };
}
