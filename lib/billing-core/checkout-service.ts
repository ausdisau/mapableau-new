import type { BillingPaymentMethod } from "@prisma/client";

import { getOrCreateBillingAccount } from "@/lib/billing-core/account-service";
import { writeBillingAuditLog } from "@/lib/billing-core/audit";
import { billingCoreConfig, isBillingStripeConfigured } from "@/lib/billing-core/config";
import { checkoutDecisionForFundingType } from "@/lib/billing-core/funding-logic";
import { getInvoiceForUser, updateInvoiceStatus } from "@/lib/billing-core/invoice-service";
import { getStripeClient } from "@/lib/stripe/client";
import { prisma } from "@/lib/prisma";

export async function createCheckoutForInvoice(userId: string, invoiceId: string) {
  const invoice = await getInvoiceForUser(invoiceId, userId);
  if (!invoice) return { ok: false as const, error: "Invoice not found" };

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

  const successUrl = `${billingCoreConfig.appUrl}/billing?checkout=success&invoiceId=${invoiceId}`;
  const cancelUrl = `${billingCoreConfig.appUrl}/billing?checkout=cancelled&invoiceId=${invoiceId}`;

  const metadata: Record<string, string> = {
    invoiceId: invoice.id,
    userId,
    serviceType: invoice.serviceType,
  };
  if (invoice.bookingId) metadata.bookingId = invoice.bookingId;

  const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
    mode: "payment",
    customer: customerId,
    line_items: [
      {
        price_data: {
          currency: invoice.currency.toLowerCase(),
          unit_amount: invoice.totalCents,
          product_data: {
            name: `MapAble ${invoice.serviceType} invoice`,
          },
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
  };

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

  if (providerAccountId && invoice.platformFeeCents >= 0) {
    sessionParams.payment_intent_data = {
      application_fee_amount: invoice.platformFeeCents,
      transfer_data: { destination: providerAccountId },
      metadata,
    };
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  await prisma.billingPayment.create({
    data: {
      invoiceId: invoice.id,
      userId,
      providerId: invoice.providerId,
      status: "requires_payment",
      method: "stripe_checkout" as BillingPaymentMethod,
      amountCents: invoice.totalCents,
      currency: invoice.currency,
      stripeCheckoutSessionId: session.id,
    },
  });

  await updateInvoiceStatus(
    invoice.id,
    "pending_payment",
    { stripeCheckoutSessionId: session.id },
    userId
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
  };
}
