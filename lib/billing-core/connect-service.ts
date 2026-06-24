import type { BillingAccountRole } from "@prisma/client";

import { getOrCreateBillingAccount } from "@/lib/billing-core/account-service";
import { writeBillingAuditLog } from "@/lib/billing-core/audit";
import { isBillingStripeConfigured } from "@/lib/billing-core/config";
import { prisma } from "@/lib/prisma";
import {
  createConnectOnboardingLink,
  createExpressConnectAccount,
  retrieveConnectAccount,
} from "@/lib/stripe/connect";



export async function createConnectAccountAndLink(
  userId: string,
  role: BillingAccountRole = "provider"
) {
  if (!isBillingStripeConfigured()) {
    return { ok: false as const, error: "Stripe is not configured" };
  }

  const account = await getOrCreateBillingAccount(userId, role);

  let connectedId = account.stripeConnectedAccountId;
  if (!connectedId) {
    const connected = await createExpressConnectAccount({ userId, role });
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

  const link = await createConnectOnboardingLink(connectedId);

  return { ok: true as const, onboardingUrl: link.url, accountId: connectedId };
}

export async function getConnectAccountStatus(
  userId: string,
  role: BillingAccountRole = "provider",
) {
  const account = await prisma.billingAccount.findUnique({
    where: { userId_role: { userId, role } },
  });

  if (!account?.stripeConnectedAccountId) {
    return {
      ok: true as const,
      connected: false,
      onboardingComplete: false,
      chargesEnabled: false,
      payoutsEnabled: false,
    };
  }

  if (!isBillingStripeConfigured()) {
    return {
      ok: true as const,
      connected: true,
      onboardingComplete: account.connectOnboardingComplete,
      chargesEnabled: account.connectOnboardingComplete,
      payoutsEnabled: account.connectOnboardingComplete,
      stripeAccountId: account.stripeConnectedAccountId,
    };
  }

  const stripeAccount = await retrieveConnectAccount(
    account.stripeConnectedAccountId,
  );
  const chargesEnabled = stripeAccount.charges_enabled === true;
  const payoutsEnabled = stripeAccount.payouts_enabled === true;
  const onboardingComplete = chargesEnabled && payoutsEnabled;

  if (onboardingComplete !== account.connectOnboardingComplete) {
    await prisma.billingAccount.update({
      where: { id: account.id },
      data: { connectOnboardingComplete: onboardingComplete },
    });
  }

  return {
    ok: true as const,
    connected: true,
    onboardingComplete,
    chargesEnabled,
    payoutsEnabled,
    stripeAccountId: account.stripeConnectedAccountId,
  };
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
  const link = await createConnectOnboardingLink(account.stripeConnectedAccountId);
  return { ok: true as const, onboardingUrl: link.url };
}
