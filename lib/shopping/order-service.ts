import type { z } from "zod";

import { createCheckoutForInvoice } from "@/lib/billing-core/checkout-service";
import { checkoutDecisionForFundingType } from "@/lib/billing-core/funding-logic";
import { createDraftInvoice } from "@/lib/billing-core/invoice-service";
import { prisma } from "@/lib/prisma";
import { stripeConfig } from "@/lib/stripe/config";
import type { ShopOrderSummary } from "@/types/shopping";

import { clearCart, validateCartForCheckout } from "./cart-service";
import type { checkoutSchema } from "./schemas";

type CheckoutInput = z.infer<typeof checkoutSchema>;

export async function getOrderForUser(orderId: string, userId: string) {
  const order = await prisma.shopOrder.findFirst({
    where: { id: orderId, userId },
    include: {
      billingInvoice: {
        include: { lineItems: true, fundingSource: true },
      },
    },
  });
  if (!order) return null;

  return {
    id: order.id,
    status: order.status,
    billingInvoiceId: order.billingInvoiceId,
    totalCents: order.billingInvoice.totalCents,
    currency: order.billingInvoice.currency,
    createdAt: order.createdAt.toISOString(),
    shippingName: order.shippingName,
    shippingEmail: order.shippingEmail,
    lineItems: order.billingInvoice.lineItems.map((li) => ({
      description: li.description,
      quantity: Number(li.quantity),
      unitAmountCents: li.unitAmountCents,
      totalCents: li.totalCents,
    })),
    fundingSource: order.billingInvoice.fundingSource
      ? {
          id: order.billingInvoice.fundingSource.id,
          type: order.billingInvoice.fundingSource.type,
          label: order.billingInvoice.fundingSource.label,
        }
      : null,
  };
}

export async function listOrdersForUser(userId: string): Promise<ShopOrderSummary[]> {
  const orders = await prisma.shopOrder.findMany({
    where: { userId },
    include: { billingInvoice: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return orders.map((order) => ({
    id: order.id,
    status: order.status,
    billingInvoiceId: order.billingInvoiceId,
    totalCents: order.billingInvoice.totalCents,
    currency: order.billingInvoice.currency,
    createdAt: order.createdAt.toISOString(),
    shippingName: order.shippingName,
    shippingEmail: order.shippingEmail,
  }));
}

export async function createOrderCheckout(userId: string, input: CheckoutInput) {
  const cartValidation = await validateCartForCheckout(userId);
  if (!cartValidation.ok) {
    return cartValidation;
  }

  const fundingSource = await prisma.billingFundingSource.findFirst({
    where: { id: input.fundingSourceId, userId },
  });
  if (!fundingSource) {
    return { ok: false as const, error: "Funding source not found" };
  }

  const decision = checkoutDecisionForFundingType(fundingSource.type);
  if (!decision.allowed) {
    return { ok: false as const, decision };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  const invoice = await createDraftInvoice(userId, {
    serviceType: "marketplace",
    fundingSourceId: fundingSource.id,
    ndisClaimable: cartValidation.lines.some((line) => line.ndisRelevant),
    lineItems: cartValidation.lines.map((line) => ({
      description: line.title,
      quantity: line.quantity,
      unitAmountCents: line.unitAmountCents,
      gstApplicable: line.gstApplicable,
      metadata: {
        shopProductId: line.productId,
        shopProductSlug: line.slug,
      },
    })),
  });

  const order = await prisma.shopOrder.create({
    data: {
      userId,
      billingInvoiceId: invoice.id,
      status: "pending_payment",
      shippingName: input.shippingName ?? user?.name,
      shippingEmail: input.shippingEmail ?? user?.email,
      shippingAddress: input.shippingAddress ?? undefined,
    },
  });

  const checkout = await createCheckoutForInvoice(userId, invoice.id, {
    successUrl: `${stripeConfig.appUrl}/shopping/orders/${order.id}?checkout=success`,
    cancelUrl: `${stripeConfig.appUrl}/shopping/cart?checkout=cancelled`,
  });
  if (!checkout.ok) {
    await prisma.shopOrder.update({
      where: { id: order.id },
      data: { status: "cancelled" },
    });
    if ("decision" in checkout && checkout.decision) {
      return { ok: false as const, decision: checkout.decision, orderId: order.id };
    }
    return {
      ok: false as const,
      error: checkout.error ?? "Checkout failed",
      orderId: order.id,
    };
  }

  return {
    ok: true as const,
    orderId: order.id,
    invoiceId: invoice.id,
    checkoutUrl: checkout.checkoutUrl,
    sessionId: checkout.sessionId,
  };
}

export async function cancelShopOrderForInvoice(invoiceId: string) {
  const order = await prisma.shopOrder.findUnique({
    where: { billingInvoiceId: invoiceId },
  });

  if (!order || order.status !== "pending_payment") {
    return;
  }

  await prisma.shopOrder.update({
    where: { id: order.id },
    data: { status: "cancelled" },
  });
}

export async function fulfillShopOrderForPaidInvoice(invoiceId: string) {
  const order = await prisma.shopOrder.findUnique({
    where: { billingInvoiceId: invoiceId },
    include: {
      billingInvoice: { include: { lineItems: true } },
    },
  });

  if (!order || order.status === "paid" || order.status === "fulfilled") {
    return;
  }

  await prisma.$transaction(async (tx) => {
    for (const lineItem of order.billingInvoice.lineItems) {
      const metadata = lineItem.metadata as { shopProductId?: string } | null;
      const productId = metadata?.shopProductId;
      if (!productId) continue;

      const product = await tx.shopProduct.findUnique({
        where: { id: productId },
        select: { stockQuantity: true },
      });
      if (product?.stockQuantity == null) continue;

      const qty = Math.round(Number(lineItem.quantity));
      await tx.shopProduct.update({
        where: { id: productId },
        data: { stockQuantity: Math.max(0, product.stockQuantity - qty) },
      });
    }

    await tx.shopOrder.update({
      where: { id: order.id },
      data: { status: "paid" },
    });
  });

  await clearCart(order.userId);
}
