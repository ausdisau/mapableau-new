import { getOrCreateBillingAccount } from "@/lib/billing-core/account-service";
import { writeBillingAuditLog } from "@/lib/billing-core/audit";
import {
  billingCoreConfig,
  isBillingStripeConfigured,
  priceIdForPlan,
} from "@/lib/billing-core/config";
import { getStripeClient } from "@/lib/stripe/client";
import type { BillingAccountRole, BillingSubscriptionPlanCode } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function roleForPlan(planCode: BillingSubscriptionPlanCode): BillingAccountRole {
  if (planCode === "employer_pro") return "employer";
  return "provider";
}

export async function createSubscriptionCheckout(
  userId: string,
  planCode: BillingSubscriptionPlanCode
) {
  if (!isBillingStripeConfigured()) {
    return { ok: false as const, error: "Stripe is not configured" };
  }

  const priceId = priceIdForPlan(planCode);
  if (!priceId) {
    return { ok: false as const, error: "Price not configured for plan" };
  }

  const role = roleForPlan(planCode);
  const account = await getOrCreateBillingAccount(userId, role);
  const stripe = getStripeClient();

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

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${billingCoreConfig.appUrl}/provider/billing?subscription=success`,
    cancel_url: `${billingCoreConfig.appUrl}/provider/billing?subscription=cancelled`,
    metadata: { mapableUserId: userId, planCode },
  });

  await prisma.billingSubscription.create({
    data: {
      userId,
      billingAccountId: account.id,
      planCode,
      status: "incomplete",
      stripeCustomerId: customerId,
      stripeSubscriptionId: `pending_checkout_${session.id}`,
      stripePriceId: priceId,
    },
  });

  await writeBillingAuditLog({
    actorUserId: userId,
    entityType: "BillingSubscription",
    entityId: session.id,
    action: "checkout_started",
    after: { planCode, sessionId: session.id },
  });

  return { ok: true as const, checkoutUrl: session.url, sessionId: session.id };
}

export async function createCustomerPortalSession(userId: string) {
  if (!isBillingStripeConfigured()) {
    return { ok: false as const, error: "Stripe is not configured" };
  }

  const account = await prisma.billingAccount.findFirst({
    where: { userId, stripeCustomerId: { not: null } },
  });
  if (!account?.stripeCustomerId) {
    return { ok: false as const, error: "No billing customer on file" };
  }

  const stripe = getStripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: account.stripeCustomerId,
    return_url: `${billingCoreConfig.appUrl}/billing`,
  });

  return { ok: true as const, portalUrl: session.url };
}
