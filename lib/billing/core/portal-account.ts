import type { BillingAccountRole } from "@prisma/client";

export type PortalBillingAccount = {
  role: BillingAccountRole;
  stripeCustomerId: string | null;
};

/**
 * Prefer the Stripe customer on the caller's billing role, then any linked customer.
 * Avoids `findFirst` attaching the wrong BillingAccount when a user has multiple roles.
 */
export function pickBillingAccountForPortal<T extends PortalBillingAccount>(
  accounts: T[],
  preferredRole?: BillingAccountRole
): T | null {
  const withCustomer = accounts.filter((account) =>
    Boolean(account.stripeCustomerId)
  );
  if (preferredRole) {
    const match = withCustomer.find((account) => account.role === preferredRole);
    if (match) return match;
  }
  return withCustomer[0] ?? null;
}
