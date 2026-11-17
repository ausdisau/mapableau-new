import type { BillingPayment, BillingPaymentMethod } from "@prisma/client";

import { getOrCreateBillingAccount } from "@/lib/billing/core/account-service";
import { writeBillingAuditLog } from "@/lib/billing/core/audit";
import { isBillingStripeConfigured } from "@/lib/billing/core/config";
import { checkoutDecisionForFundingType } from "@/lib/billing/core/funding-logic";
import { getInvoiceForUser, updateInvoiceStatus } from "@/lib/billing/core/invoice-service";
import { prisma } from "@/lib/prisma";
import { buildBillingPaymentCheckout } from "@/lib/stripe/checkout";
import { getStripeClient } from "@/lib/stripe/client";

/**
 * Serialize checkout creation per invoice and reuse an in-flight payment row
 * (including rows that do not yet have a Stripe session id). Prevents two
 * overlapping requests from inserting distinct payments and opening two
 * payable Checkout Sessions for the same cart.
 */
async function reserveCheckoutPayment(params: {
  invoiceId: string;
  userId: string;
  providerId: string | null;
  amountCents: number;
  currency: string;
  transferGroup: string | null;
}): Promise<
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
  const reserveParams = {
    invoiceId: invoice.id,
    userId,
    providerId: invoice.providerId,
    amountCents: invoice.totalCents,
    currency: invoice.currency,
    transferGroup: invoice.transferGroup,
  };

  let reserved = await reserveCheckoutPayment(reserveParams);
  if (!reserved.ok) {
    return { ok: false as const, error: reserved.error };
  }

  let payment = reserved.payment;
  let reusedExistingSession = false;

  if (payment.stripeCheckoutSessionId) {
    try {
      const existingSession = await stripe.checkout.sessions.retrieve(
        payment.stripeCheckoutSessionId,
      );
      if (existingSession.status === "open" && existingSession.url) {
        return {
          ok: true as const,
          checkoutUrl: existingSession.url,
          sessionId: existingSession.id,
          reused: true as const,
        };
      }
      if (existingSession.status === "complete") {
        return {
          ok: false as const,
          error:
            "Checkout already completed for this invoice. Waiting for webhook confirmation — do not pay again.",
        };
      }

      // Expired/abandoned session: retire payment and reserve a replacement so
      // the Stripe idempotency key (payment-scoped) is not reused for a dead session.
      await markPaymentFailed(
        payment.id,
        `replaced_after_session_${existingSession.status ?? "closed"}`,
      );
      reserved = await reserveCheckoutPayment(reserveParams);
      if (!reserved.ok) {
        return { ok: false as const, error: reserved.error };
      }
      payment = reserved.payment;
      if (payment.stripeCheckoutSessionId) {
        const again = await stripe.checkout.sessions.retrieve(
          payment.stripeCheckoutSessionId,
        );
        if (again.status === "open" && again.url) {
          return {
            ok: true as const,
            checkoutUrl: again.url,
            sessionId: again.id,
            reused: true as const,
          };
        }
      }
    } catch {
      // Session missing or unreadable — create a fresh session on this payment.
    }
  } else if (!reserved.created) {
    // Another request reserved this payment and is still creating the Stripe
    // session. Poll briefly for the session id rather than opening a second one.
    for (let attempt = 0; attempt < 8; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      const refreshed = await prisma.billingPayment.findUnique({
        where: { id: payment.id },
      });
      if (refreshed?.stripeCheckoutSessionId) {
        payment = refreshed;
        reusedExistingSession = true;
        break;
      }
      if (refreshed && refreshed.status !== "requires_payment") {
        return {
          ok: false as const,
          error: "Invoice payment already succeeded",
        };
      }
    }
    if (payment.stripeCheckoutSessionId) {
      const existingSession = await stripe.checkout.sessions.retrieve(
        payment.stripeCheckoutSessionId,
      );
      if (existingSession.status === "open" && existingSession.url) {
        return {
          ok: true as const,
          checkoutUrl: existingSession.url,
          sessionId: existingSession.id,
          reused: true as const,
        };
      }
    }
  }

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

  // Idempotency key is payment-scoped. Concurrent callers that reserved the
  // same payment row send the same key, so Stripe collapses duplicate creates.
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
    reused: reusedExistingSession,
  };
}
