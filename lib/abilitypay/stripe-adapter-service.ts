import type { MapAbleUserRole } from "@prisma/client";

import { getOrCreateBillingAccount } from "@/lib/billing-core/account-service";
import { writeBillingAuditLog } from "@/lib/billing-core/audit";
import { calculateInvoiceTotals } from "@/lib/billing-core/calculations";
import { isBillingStripeConfigured } from "@/lib/billing-core/config";
import { checkoutDecisionForFundingType } from "@/lib/billing-core/funding-logic";
import { createFundingSource } from "@/lib/billing-core/funding-source-service";
import { updateInvoiceStatus } from "@/lib/billing-core/invoice-service";
import { prisma } from "@/lib/prisma";
import { buildBillingPaymentCheckout } from "@/lib/stripe/checkout";
import { getStripeClient } from "@/lib/stripe/client";

import { logAbilityPayEvent } from "./audit";
import {
  billingFundingTypeForModel,
  fundingModelLabel,
  resolveFundingModel,
} from "./funding-model";

export type AbilityPayCheckoutResult =
  | {
      ok: true;
      checkoutUrl: string | null;
      sessionId: string;
      billingInvoiceId: string;
      paymentAttemptId: string;
    }
  | {
      ok: false;
      error: string;
      code?: "STRIPE_NOT_CONFIGURED" | "NOT_READY" | "WRONG_ROUTE";
    };

async function ensureFundingSource(
  participantId: string,
  fundingType: NonNullable<ReturnType<typeof billingFundingTypeForModel>>
) {
  const existing = await prisma.billingFundingSource.findFirst({
    where: { userId: participantId, type: fundingType },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  if (existing) return existing;

  return createFundingSource(participantId, {
    type: fundingType,
    label: fundingModelLabel(
      fundingType === "ndis_self_managed"
        ? "self_managed"
        : fundingType === "private_card"
          ? "private_pay"
          : "plan_managed"
    ),
    isDefault: true,
  });
}

export async function ensureBillingInvoiceForAbilityPay(
  abilityPayInvoiceId: string
) {
  const invoice = await prisma.abilityPayInvoice.findUnique({
    where: { id: abilityPayInvoiceId },
    include: {
      lineItems: { orderBy: { sortOrder: "asc" } },
      provider: true,
      plan: { select: { fundingModel: true } },
    },
  });
  if (!invoice) throw new Error("INVOICE_NOT_FOUND");

  if (invoice.billingInvoiceId) {
    return prisma.billingInvoice.findUniqueOrThrow({
      where: { id: invoice.billingInvoiceId },
      include: { lineItems: true, fundingSource: true },
    });
  }

  const model = resolveFundingModel({
    invoiceFundingModel: invoice.fundingModel,
    planFundingModel: invoice.plan?.fundingModel,
  });
  const fundingType = billingFundingTypeForModel(model);
  if (!fundingType) throw new Error("STRIPE_NOT_APPLICABLE");

  const fundingSource = await ensureFundingSource(
    invoice.participantId,
    fundingType
  );

  const calcItems = invoice.lineItems.map((line) => ({
    quantity: Number(line.quantity),
    unitAmountCents: line.unitPriceCents,
    gstApplicable: false,
  }));
  const totals = calculateInvoiceTotals(calcItems);

  const billingInvoice = await prisma.billingInvoice.create({
    data: {
      userId: invoice.participantId,
      providerId: invoice.provider?.organisationId ?? undefined,
      serviceType: "other",
      status: "draft",
      fundingSourceId: fundingSource.id,
      subtotalCents: totals.subtotalCents,
      platformFeeCents: totals.platformFeeCents,
      gstCents: totals.gstCents,
      totalCents: totals.totalCents,
      ndisClaimable: model !== "private_pay",
      dueAt: invoice.dueDate ?? undefined,
      lineItems: {
        create: invoice.lineItems.map((line) => ({
          description: line.description,
          quantity: line.quantity,
          unitAmountCents: line.unitPriceCents,
          totalCents: line.totalCents,
          ndisLineItem: line.supportItemCode ?? undefined,
          gstApplicable: false,
          metadata: { abilityPayLineItemId: line.id },
        })),
      },
    },
    include: { lineItems: true, fundingSource: true },
  });

  await prisma.abilityPayInvoice.update({
    where: { id: abilityPayInvoiceId },
    data: { billingInvoiceId: billingInvoice.id },
  });

  await writeBillingAuditLog({
    actorUserId: invoice.participantId,
    entityType: "BillingInvoice",
    entityId: billingInvoice.id,
    action: "abilitypay_bridge_created",
    after: { abilityPayInvoiceId },
  });

  return billingInvoice;
}

export async function createCheckoutForAbilityPayInvoice(params: {
  abilityPayInvoiceId: string;
  actorUserId: string;
  actorRole: MapAbleUserRole;
}): Promise<AbilityPayCheckoutResult> {
  const invoice = await prisma.abilityPayInvoice.findUnique({
    where: { id: params.abilityPayInvoiceId },
    include: {
      plan: { select: { fundingModel: true } },
      paymentAttempts: {
        where: { adapter: "stripe_checkout" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  if (!invoice) return { ok: false, error: "Invoice not found" };

  if (invoice.status !== "approved") {
    return { ok: false, error: "Invoice must be approved before payment", code: "NOT_READY" };
  }
  if (
    invoice.paymentStatus !== "ready_to_pay" &&
    invoice.paymentStatus !== "processing"
  ) {
    return { ok: false, error: "Invoice is not ready for payment", code: "NOT_READY" };
  }

  const model = resolveFundingModel({
    invoiceFundingModel: invoice.fundingModel,
    planFundingModel: invoice.plan?.fundingModel,
  });
  const fundingType = billingFundingTypeForModel(model);
  if (!fundingType) {
    return {
      ok: false,
      error: "Card payment is not available for this funding model",
      code: "WRONG_ROUTE",
    };
  }

  const decision = checkoutDecisionForFundingType(fundingType);
  if (!decision.allowed) {
    return {
      ok: false,
      error: decision.instruction,
      code: "WRONG_ROUTE",
    };
  }

  if (!isBillingStripeConfigured()) {
    return {
      ok: false,
      error: "Stripe is not configured",
      code: "STRIPE_NOT_CONFIGURED",
    };
  }

  const billingInvoice = await ensureBillingInvoiceForAbilityPay(
    params.abilityPayInvoiceId
  );

  const account = await getOrCreateBillingAccount(
    invoice.participantId,
    "participant"
  );

  let customerId = account.stripeCustomerId;
  if (!customerId) {
    const stripe = getStripeClient();
    const user = await prisma.user.findUnique({
      where: { id: invoice.participantId },
    });
    const customer = await stripe.customers.create({
      email: user?.email ?? undefined,
      metadata: { mapableUserId: invoice.participantId },
    });
    customerId = customer.id;
    await prisma.billingAccount.update({
      where: { id: account.id },
      data: { stripeCustomerId: customerId },
    });
  }

  let providerAccountId: string | null = null;
  if (billingInvoice.providerId) {
    const providerAccount = await prisma.billingAccount.findFirst({
      where: {
        role: "provider",
        stripeConnectedAccountId: { not: null },
        user: {
          organisationMemberships: {
            some: { organisationId: billingInvoice.providerId },
          },
        },
      },
    });
    providerAccountId = providerAccount?.stripeConnectedAccountId ?? null;
  }

  const session = await buildBillingPaymentCheckout({
    invoiceId: billingInvoice.id,
    userId: invoice.participantId,
    serviceType: billingInvoice.serviceType,
    totalCents: billingInvoice.totalCents,
    currency: billingInvoice.currency,
    customerId,
    productLabel: "AbilityPay support invoice",
    platformFeeCents: billingInvoice.platformFeeCents,
    providerConnectedAccountId: providerAccountId,
    abilityPayInvoiceId: params.abilityPayInvoiceId,
  });

  const payment = await prisma.billingPayment.create({
    data: {
      invoiceId: billingInvoice.id,
      userId: invoice.participantId,
      providerId: billingInvoice.providerId,
      status: "requires_payment",
      method: "stripe_checkout",
      amountCents: billingInvoice.totalCents,
      currency: billingInvoice.currency,
      stripeCheckoutSessionId: session.id,
    },
  });

  await updateInvoiceStatus(
    billingInvoice.id,
    "pending_payment",
    { stripeCheckoutSessionId: session.id },
    params.actorUserId
  );

  const attempt =
    invoice.paymentAttempts[0] ??
    (await prisma.abilityPayPaymentAttempt.create({
      data: {
        invoiceId: params.abilityPayInvoiceId,
        adapter: "stripe_checkout",
        status: "pending",
        metadata: { fundingModel: model },
      },
    }));

  await prisma.$transaction([
    prisma.abilityPayPaymentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: "processing",
        billingInvoiceId: billingInvoice.id,
        billingPaymentId: payment.id,
        externalRef: session.id,
      },
    }),
    prisma.abilityPayInvoice.update({
      where: { id: params.abilityPayInvoiceId },
      data: { paymentStatus: "processing" },
    }),
  ]);

  await logAbilityPayEvent({
    action: "abilitypay.payment.initiated",
    entityType: "AbilityPayPaymentAttempt",
    entityId: attempt.id,
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    participantId: invoice.participantId,
    metadata: {
      adapter: "stripe_checkout",
      billingInvoiceId: billingInvoice.id,
      sessionId: session.id,
    },
  });

  return {
    ok: true,
    checkoutUrl: session.url,
    sessionId: session.id,
    billingInvoiceId: billingInvoice.id,
    paymentAttemptId: attempt.id,
  };
}
