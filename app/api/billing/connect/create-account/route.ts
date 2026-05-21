import { NextResponse } from "next/server";

import { auth } from "@/app/lib/auth";
import { createAuditLog } from "@/lib/billing/audit";
import { requireAuthUserId, isAuthError } from "@/lib/billing/auth";
import {
  createConnectAccount,
  createConnectOnboardingLink,
} from "@/lib/billing/checkout";
import { prisma } from "@/lib/prisma";
import { createConnectAccountSchema } from "@/schemas/billing.types";

export async function POST(request: Request) {
  const authResult = await requireAuthUserId();
  if (isAuthError(authResult)) return authResult;
  const { userId } = authResult;

  let body: unknown = {};
  try {
    const text = await request.text();
    if (text) body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createConnectAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "User email required" }, { status: 400 });
  }

  const role = parsed.data.role;

  let billingAccount = await prisma.billingAccount.findUnique({
    where: { userId_role: { userId, role } },
  });

  if (!billingAccount?.stripeConnectedAccountId) {
    const account = await createConnectAccount(email);
    billingAccount = await prisma.billingAccount.upsert({
      where: { userId_role: { userId, role } },
      create: {
        userId,
        role,
        stripeConnectedAccountId: account.id,
        connectOnboardingComplete: false,
      },
      update: {
        stripeConnectedAccountId: account.id,
      },
    });

    await createAuditLog({
      actorUserId: userId,
      entityType: "BillingAccount",
      entityId: billingAccount.id,
      action: "connect_account_created",
      after: { stripeConnectedAccountId: account.id },
    });
  }

  const accountId = billingAccount.stripeConnectedAccountId;
  if (!accountId) {
    return NextResponse.json(
      { error: "Failed to create connected account" },
      { status: 500 }
    );
  }

  const link = await createConnectOnboardingLink(accountId);

  return NextResponse.json({
    accountId,
    onboardingUrl: link.url,
    connectOnboardingComplete: billingAccount.connectOnboardingComplete,
  });
}
