import type { BillingAccountRole, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe/client";

export async function getOrCreateBillingAccount(
  userId: string,
  role: BillingAccountRole,
  email: string,
  name?: string
) {
  const existing = await prisma.billingAccount.findUnique({
    where: { userId_role: { userId, role } },
  });
  if (existing) return existing;

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email,
    name: name ?? undefined,
    metadata: { mapableUserId: userId, role },
  });

  return prisma.billingAccount.create({
    data: {
      userId,
      role,
      stripeCustomerId: customer.id,
    },
  });
}

export async function ensureStripeCustomer(
  billingAccount: Prisma.BillingAccountGetPayload<object>,
  email: string,
  name?: string
) {
  if (billingAccount.stripeCustomerId) {
    return billingAccount.stripeCustomerId;
  }

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email,
    name: name ?? undefined,
    metadata: { mapableUserId: billingAccount.userId, role: billingAccount.role },
  });

  await prisma.billingAccount.update({
    where: { id: billingAccount.id },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}
