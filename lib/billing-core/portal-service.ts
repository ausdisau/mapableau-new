import type { BillingAccountRole } from "@prisma/client";

import {
  ensureStripeCustomerForUser,
  getOrCreateBillingAccount,
} from "@/lib/billing-core/account-service";
import { writeBillingAuditLog } from "@/lib/billing-core/audit";
import { billingCoreConfig, isBillingStripeConfigured } from "@/lib/billing-core/config";
import { createBillingPortalSession } from "@/lib/stripe/portal";

export type CustomerPortalSessionResult =
  | { ok: true; portalUrl: string }
  | { ok: false; error: string };

const DEFAULT_RETURN_URLS: Partial<Record<BillingAccountRole, string>> = {
  participant: `${billingCoreConfig.appUrl}/dashboard/billing/invoices`,
  provider: `${billingCoreConfig.appUrl}/provider/billing`,
  employer: `${billingCoreConfig.appUrl}/employer/billing`,
};

export async function createCustomerPortalSession(params: {
  userId: string;
  role?: BillingAccountRole;
  returnUrl?: string;
  createCustomerIfMissing?: boolean;
}): Promise<CustomerPortalSessionResult> {
  if (!isBillingStripeConfigured()) {
    return { ok: false, error: "Stripe is not configured" };
  }

  const role = params.role ?? "participant";
  const account = await getOrCreateBillingAccount(params.userId, role);

  let customerId = account.stripeCustomerId;
  if (!customerId) {
    if (!params.createCustomerIfMissing) {
      return { ok: false, error: "No billing customer on file" };
    }
    const ensured = await ensureStripeCustomerForUser(params.userId, role);
    customerId = ensured.stripeCustomerId;
    if (!customerId) {
      return { ok: false, error: "Could not create billing customer" };
    }
  }

  const returnUrl =
    params.returnUrl ??
    DEFAULT_RETURN_URLS[role] ??
    `${billingCoreConfig.appUrl}/dashboard/billing/invoices`;

  const session = await createBillingPortalSession({
    stripeCustomerId: customerId,
    returnUrl,
  });

  await writeBillingAuditLog({
    actorUserId: params.userId,
    entityType: "BillingAccount",
    entityId: account.id,
    action: "customer_portal_opened",
    after: { role, returnUrl },
  });

  if (!session.url) {
    return { ok: false, error: "Billing portal URL unavailable" };
  }

  return { ok: true, portalUrl: session.url };
}
