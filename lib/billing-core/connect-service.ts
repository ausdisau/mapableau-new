import { writeBillingAuditLog } from "@/lib/billing-core/audit";
import { billingCoreConfig, isBillingStripeConfigured } from "@/lib/billing-core/config";
import { getOrCreateBillingAccount } from "@/lib/billing-core/account-service";
import { getStripeClient } from "@/lib/stripe/client";
import type { BillingAccountRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function createConnectAccountAndLink(
  userId: string,
  role: BillingAccountRole = "provider"
) {
  if (!isBillingStripeConfigured()) {
    return { ok: false as const, error: "Stripe is not configured" };
  }

  const stripe = getStripeClient();
  const account = await getOrCreateBillingAccount(userId, role);

  let connectedId = account.stripeConnectedAccountId;
  if (!connectedId) {
    const connected = await stripe.accounts.create({
      type: "express",
      country: "AU",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: { mapableUserId: userId, mapableRole: role },
    });
    connectedId = connected.id;
    await prisma.billingAccount.update({
      where: { id: account.id },
      data: { stripeConnectedAccountId: connectedId },
    });
    await writeBillingAuditLog({
      actorUserId: userId,
      entityType: "BillingAccount",
      entityId: account.id,
      action: "connect_account_created",
      after: { stripeConnectedAccountId: connectedId },
    });
  }

  const link = await stripe.accountLinks.create({
    account: connectedId,
    refresh_url: `${billingCoreConfig.appUrl}/provider/billing?onboarding=refresh`,
    return_url: `${billingCoreConfig.appUrl}/provider/billing?onboarding=complete`,
    type: "account_onboarding",
  });

  return { ok: true as const, onboardingUrl: link.url, accountId: connectedId };
}

export async function refreshConnectOnboardingLink(
  userId: string,
  role: BillingAccountRole = "provider"
) {
  const account = await prisma.billingAccount.findUnique({
    where: { userId_role: { userId, role } },
  });
  if (!account?.stripeConnectedAccountId) {
    return createConnectAccountAndLink(userId, role);
  }
  if (!isBillingStripeConfigured()) {
    return { ok: false as const, error: "Stripe is not configured" };
  }
  const stripe = getStripeClient();
  const link = await stripe.accountLinks.create({
    account: account.stripeConnectedAccountId,
    refresh_url: `${billingCoreConfig.appUrl}/provider/billing?onboarding=refresh`,
    return_url: `${billingCoreConfig.appUrl}/provider/billing?onboarding=complete`,
    type: "account_onboarding",
  });
  return { ok: true as const, onboardingUrl: link.url };
}
