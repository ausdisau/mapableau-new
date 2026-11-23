import type { BillingPaymentMethod } from "@prisma/client";
import type Stripe from "stripe";

import { getOrCreateBillingAccount } from "@/lib/billing/core/account-service";
import { writeBillingAuditLog } from "@/lib/billing/core/audit";
import { isBillingStripeConfigured } from "@/lib/billing/core/config";
import { checkoutDecisionForFundingType } from "@/lib/billing/core/funding-logic";
import { getInvoiceForUser, updateInvoiceStatus } from "@/lib/billing/core/invoice-service";
import { payoutPolicyDefaults } from "@/lib/payouts/config";
import { prisma } from "@/lib/prisma";
import { STRIPE_API_VERSION, getStripeClient } from "@/lib/stripe/client";
import { stripeConfig } from "@/lib/stripe/config";
import { billingCheckoutMetadata } from "@/lib/stripe/metadata";

/**
 * Create PaymentSheet credentials for a BillingInvoice.
 * Reuses Checkout funding gates; wallets via automatic_payment_methods.
 * Method stored as stripe_checkout (enum-compatible) with audit distinguishing sheet.
 */
export async function createPaymentSheetForInvoice(
  userId: string,
  invoiceId: string
) {
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

  const account = await getOrCreateBillingAccount(userId, "participant");
  const stripe = getStripeClient();

  let customerId = account.stripeCustomerId;
  if (!customerId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const customer = await stripe.customers.create({
      email: user?.email ?? undefined,
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

  const payment = await prisma.billingPayment.create({
    data: {
      invoiceId: invoice.id,
      userId,
      providerId: invoice.providerId,
      status: "requires_payment",
      method: "stripe_checkout" as BillingPaymentMethod,
      amountCents: invoice.totalCents,
      currency: invoice.currency,
      transferGroup: invoice.transferGroup ?? undefined,
    },
  });

  const metadata = billingCheckoutMetadata({
    invoiceId: invoice.id,
    userId,
    serviceType: invoice.serviceType,
    bookingId: invoice.bookingId ?? undefined,
    paymentId: payment.id,
    transferGroup: invoice.transferGroup ?? undefined,
    fundingSourceType: invoice.fundingSource?.type,
  });
  metadata.paymentSurface = "payment_sheet";

  const currency = (invoice.currency || stripeConfig.defaultCurrency).toLowerCase();
  const useSeparate = payoutPolicyDefaults.useSeparateChargesAndTransfers;

  const piParams: Stripe.PaymentIntentCreateParams = {
    amount: invoice.totalCents,
    currency,
    customer: customerId,
    automatic_payment_methods: { enabled: true },
    metadata,
  };

  if (invoice.transferGroup) {
    piParams.transfer_group = invoice.transferGroup;
  }

  if (
    !useSeparate &&
    providerAccountId &&
    invoice.platformFeeCents !== undefined &&
    invoice.platformFeeCents !== null
  ) {
    piParams.application_fee_amount = invoice.platformFeeCents;
    piParams.transfer_data = { destination: providerAccountId };
  }

  const paymentIntent = await stripe.paymentIntents.create(piParams);

  const ephemeralKey = await stripe.ephemeralKeys.create(
    { customer: customerId },
    { apiVersion: STRIPE_API_VERSION }
  );

  await prisma.billingPayment.update({
    where: { id: payment.id },
    data: { stripePaymentIntentId: paymentIntent.id },
  });

  await updateInvoiceStatus(
    invoice.id,
    "pending_payment",
    { stripePaymentIntentId: paymentIntent.id },
    userId
  );

  await writeBillingAuditLog({
    actorUserId: userId,
    entityType: "BillingInvoice",
    entityId: invoice.id,
    action: "payment_sheet_intent_created",
    after: {
      paymentId: payment.id,
      stripePaymentIntentId: paymentIntent.id,
    },
  });

  if (!paymentIntent.client_secret) {
    return { ok: false as const, error: "PaymentIntent missing client secret" };
  }

  return {
    ok: true as const,
    customerId,
    ephemeralKey: ephemeralKey.secret,
    paymentIntentClientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    paymentId: payment.id,
    publishableKeyHint: "Use NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY / EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY on the client",
  };
}
