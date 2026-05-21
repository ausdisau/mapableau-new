import { NextResponse } from "next/server";

import { auth } from "@/app/lib/auth";
import { ensureStripeCustomer } from "@/lib/billing/accounts";
import { requireAuthUserId, isAuthError } from "@/lib/billing/auth";
import { prisma } from "@/lib/prisma";
import { getStripe, getAppUrl } from "@/lib/stripe/client";

export async function POST() {
  const authResult = await requireAuthUserId();
  if (isAuthError(authResult)) return authResult;
  const { userId } = authResult;

  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "User email required" }, { status: 400 });
  }

  const billingAccount = await prisma.billingAccount.findFirst({
    where: {
      userId,
      stripeCustomerId: { not: null },
    },
    orderBy: { updatedAt: "desc" },
  });

  if (!billingAccount) {
    return NextResponse.json(
      { error: "No billing account with Stripe customer found" },
      { status: 404 }
    );
  }

  const stripeCustomerId = await ensureStripeCustomer(
    billingAccount,
    email,
    session?.user?.name ?? undefined
  );

  const stripe = getStripe();
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${getAppUrl()}/billing`,
  });

  return NextResponse.json({ url: portalSession.url });
}
