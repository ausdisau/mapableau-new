import type { BillingAccountRole, BillingSubscriptionPlanCode } from "@prisma/client";

import { getOrCreateBillingAccount } from "@/lib/billing/core/account-service";
import { writeBillingAuditLog } from "@/lib/billing/core/audit";
import { billingAccountRoleForUserRole } from "@/lib/billing/core/billing-role";
import {
  billingCoreConfig,
  isBillingStripeConfigured,
  priceIdForPlan,
} from "@/lib/billing/core/config";
import { pickBillingAccountForPortal } from "@/lib/billing/core/portal-account";
import { prisma } from "@/lib/prisma";
import { createStripeSubscriptionCheckoutSession } from "@/lib/stripe/checkout";
import { getStripeClient } from "@/lib/stripe/client";
import {
  createBillingPortalSession,
  type BillingPortalFlow,
} from "@/lib/stripe/portal";
import type { UserRole } from "@/types/mapable";

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

  const session = await createStripeSubscriptionCheckoutSession({
    customerId,
    priceId,
    successUrl: `${billingCoreConfig.appUrl}/provider/billing?subscription=success`,
    cancelUrl: `${billingCoreConfig.appUrl}/provider/billing?subscription=cancelled`,
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
  options?: {
    preferredRole?: BillingAccountRole;
    flow?: BillingPortalFlow;
  }
) {
  if (!isBillingStripeConfigured()) {
    return { ok: false as const, error: "Stripe is not configured" };
  }

  const accounts = await prisma.billingAccount.findMany({
    where: { userId, stripeCustomerId: { not: null } },
    orderBy: { updatedAt: "desc" },
  });
  const account = pickBillingAccountForPortal(accounts, options?.preferredRole);
  if (!account?.stripeCustomerId) {
    return { ok: false as const, error: "No billing customer on file" };
  }

  const session = await createBillingPortalSession(account.stripeCustomerId, {
    flow: options?.flow,
  });

  return { ok: true as const, portalUrl: session.url };
}

export function preferredPortalRoleForUserRole(
  role: UserRole
): BillingAccountRole {
  return billingAccountRoleForUserRole(role);
}
