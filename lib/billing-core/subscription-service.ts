import type { BillingAccountRole, BillingSubscriptionPlanCode } from "@prisma/client";

import { getOrCreateBillingAccount } from "@/lib/billing-core/account-service";
import { writeBillingAuditLog } from "@/lib/billing-core/audit";
import {
  billingCoreConfig,
  isBillingStripeConfigured,
  priceIdForPlan,
} from "@/lib/billing-core/config";
import { prisma } from "@/lib/prisma";
import { createStripeSubscriptionCheckoutSession } from "@/lib/stripe/checkout";
import { getStripeClient } from "@/lib/stripe/client";
import { createBillingPortalSession } from "@/lib/stripe/portal";

function roleForPlan(planCode: BillingSubscriptionPlanCode): BillingAccountRole {
  if (planCode === "employer_pro") return "employer";
  if (
    planCode === "ai_verify_starter" ||
    planCode === "ai_verify_operations" ||
    planCode === "ai_verify_portfolio" ||
    planCode === "ai_learning_organisation" ||
    planCode === "ai_enterprise"
  ) {
    return "participant";
  }
  return "provider";
}

function checkoutUrlsForPlan(planCode: BillingSubscriptionPlanCode): {
  successUrl: string;
  cancelUrl: string;
} {
  if (String(planCode).startsWith("ai_")) {
    return {
      successUrl: `${billingCoreConfig.appUrl}/verify?subscription=success`,
      cancelUrl: `${billingCoreConfig.appUrl}/verify?subscription=cancelled`,
    };
  }
  return {
    successUrl: `${billingCoreConfig.appUrl}/provider/billing?subscription=success`,
    cancelUrl: `${billingCoreConfig.appUrl}/provider/billing?subscription=cancelled`,
  };
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
    return {
      ok: false as const,
      error:
        "Price not configured for plan. Set the matching STRIPE_AI_*_PRICE_ID (or provider/employer price) in test mode — prices are never invented.",
    };
  }

  const role = roleForPlan(planCode);
  const account = await getOrCreateBillingAccount(userId, role);

  let customerId = account.stripeCustomerId;
  if (!customerId) {
    const stripe = getStripeClient();
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

  const urls = checkoutUrlsForPlan(planCode);
  const session = await createStripeSubscriptionCheckoutSession({
    customerId,
    priceId,
    successUrl: urls.successUrl,
    cancelUrl: urls.cancelUrl,
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

  const session = await createBillingPortalSession(account.stripeCustomerId);

  return { ok: true as const, portalUrl: session.url };
}
