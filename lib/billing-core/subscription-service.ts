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
  if (planCode === "plan_manager_pro") return "provider";
  return "provider";
}

function billingPathForPlan(planCode: BillingSubscriptionPlanCode): string {
  if (planCode === "employer_pro") return "/employer/billing";
  if (planCode === "plan_manager_pro") return "/plan-manager/billing";
  return "/provider/billing";
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

  const billingPath = billingPathForPlan(planCode);
  const session = await createStripeSubscriptionCheckoutSession({
    customerId,
    priceId,
    successUrl: `${billingCoreConfig.appUrl}${billingPath}?subscription=success`,
    cancelUrl: `${billingCoreConfig.appUrl}${billingPath}?subscription=cancelled`,
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

export async function createCustomerPortalSession(
  userId: string,
  role: BillingAccountRole = "provider",
  returnPathOverride?: string
) {
  if (!isBillingStripeConfigured()) {
    return { ok: false as const, error: "Stripe is not configured" };
  }

  const account = await prisma.billingAccount.findUnique({
    where: { userId_role: { userId, role } },
  });
  if (!account?.stripeCustomerId) {
    return { ok: false as const, error: "No billing customer on file" };
  }

  const returnPath =
    returnPathOverride ??
    (role === "employer" ? "/employer/billing" : "/provider/billing");
  const session = await createBillingPortalSession(
    account.stripeCustomerId,
    `${billingCoreConfig.appUrl}${returnPath}`
  );

  return { ok: true as const, portalUrl: session.url };
}
