import { NextResponse } from "next/server";

import { requireAuthUserId, isAuthError } from "@/lib/billing/auth";
import { createConnectOnboardingLink } from "@/lib/billing/checkout";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const authResult = await requireAuthUserId();
  if (isAuthError(authResult)) return authResult;
  const { userId } = authResult;

  const billingAccount = await prisma.billingAccount.findFirst({
    where: {
      userId,
      role: { in: ["provider", "employer"] },
      stripeConnectedAccountId: { not: null },
    },
    orderBy: { updatedAt: "desc" },
  });

  if (!billingAccount?.stripeConnectedAccountId) {
    return NextResponse.json(
      { error: "No connected account found. Create one first." },
      { status: 404 }
    );
  }

  const link = await createConnectOnboardingLink(
    billingAccount.stripeConnectedAccountId
  );

  return NextResponse.json({
    onboardingUrl: link.url,
    accountId: billingAccount.stripeConnectedAccountId,
  });
}
