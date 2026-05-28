import type { BillingSubscriptionPlanCode } from "@prisma/client";

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

const ORG_BILLING_ADMIN_ROLES = ["provider_admin"] as const;

export async function assertOrgBillingAdmin(
  userId: string,
  organisationId: string
) {
  const member = await prisma.organisationMember.findUnique({
    where: {
      userId_organisationId: { userId, organisationId },
    },
  });
  if (!member || !ORG_BILLING_ADMIN_ROLES.includes(member.role as "provider_admin")) {
    throw new Error("FORBIDDEN");
  }
}

/**
 * Organisation-scoped billing account (Provider Pro). Falls back to creating a
 * provider-role account owned by the acting admin until Stripe org customers ship.
 */
export async function getOrCreateOrganisationBillingAccount(
  organisationId: string,
  payerUserId: string
) {
  const org = await prisma.organisation.findUnique({
    where: { id: organisationId },
    include: { billingAccount: true },
  });
  if (!org) throw new Error("NOT_FOUND");

  if (org.billingAccount) {
    return org.billingAccount;
  }

  const account = await getOrCreateBillingAccount(payerUserId, "provider");
  await prisma.organisation.update({
    where: { id: organisationId },
    data: { billingAccountId: account.id },
  });

  await writeBillingAuditLog({
    actorUserId: payerUserId,
    entityType: "Organisation",
    entityId: organisationId,
    action: "billing_account_linked",
    after: { billingAccountId: account.id },
  });

  return account;
}

export async function createOrganisationSubscriptionCheckout(
  organisationId: string,
  payerUserId: string,
  planCode: BillingSubscriptionPlanCode = "provider_pro"
) {
  await assertOrgBillingAdmin(payerUserId, organisationId);

  if (!isBillingStripeConfigured()) {
    return { ok: false as const, error: "Stripe is not configured" };
  }

  const priceId = priceIdForPlan(planCode);
  if (!priceId) {
    return { ok: false as const, error: "Price not configured for plan" };
  }

  const account = await getOrCreateOrganisationBillingAccount(
    organisationId,
    payerUserId
  );

  let customerId = account.stripeCustomerId;
  if (!customerId) {
    const stripe = getStripeClient();
    const user = await prisma.user.findUnique({ where: { id: payerUserId } });
    const customer = await stripe.customers.create({
      email: user?.email,
      metadata: {
        mapableUserId: payerUserId,
        mapableOrganisationId: organisationId,
      },
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
    successUrl: `${billingCoreConfig.appUrl}/provider/cloud?subscription=success&org=${organisationId}`,
    cancelUrl: `${billingCoreConfig.appUrl}/provider/cloud?subscription=cancelled`,
    metadata: {
      mapableUserId: payerUserId,
      mapableOrganisationId: organisationId,
      planCode,
    },
  });

  await prisma.billingSubscription.create({
    data: {
      userId: payerUserId,
      billingAccountId: account.id,
      planCode,
      status: "incomplete",
      stripeCustomerId: customerId,
      stripeSubscriptionId: `pending_checkout_${session.id}`,
      stripePriceId: priceId,
    },
  });

  await writeBillingAuditLog({
    actorUserId: payerUserId,
    entityType: "BillingSubscription",
    entityId: session.id,
    action: "org_checkout_started",
    after: { organisationId, planCode, sessionId: session.id },
  });

  return { ok: true as const, checkoutUrl: session.url, sessionId: session.id };
}

export async function getSubscriptionForOrganisation(organisationId: string) {
  const org = await prisma.organisation.findUnique({
    where: { id: organisationId },
    include: {
      billingAccount: {
        include: {
          subscriptions: { orderBy: { updatedAt: "desc" }, take: 1 },
        },
      },
    },
  });
  if (!org?.billingAccount) return null;
  return org.billingAccount.subscriptions[0] ?? null;
}
