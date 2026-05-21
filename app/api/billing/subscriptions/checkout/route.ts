import { NextResponse } from "next/server";

import { auth } from "@/app/lib/auth";
import { getOrCreateBillingAccount, ensureStripeCustomer } from "@/lib/billing/accounts";
import { createAuditLog } from "@/lib/billing/audit";
import { requireAuthUserId, isAuthError } from "@/lib/billing/auth";
import { createSubscriptionCheckoutSession } from "@/lib/billing/checkout";
import { subscriptionCheckoutSchema } from "@/schemas/billing.types";

export async function POST(request: Request) {
  const authResult = await requireAuthUserId();
  if (isAuthError(authResult)) return authResult;
  const { userId } = authResult;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = subscriptionCheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (
    parsed.data.planCode !== "provider_pro" &&
    parsed.data.planCode !== "employer_pro"
  ) {
    return NextResponse.json(
      { error: "Subscription checkout not available for this plan" },
      { status: 400 }
    );
  }

  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "User email required" }, { status: 400 });
  }

  const role =
    parsed.data.planCode === "employer_pro" ? "employer" : "provider";

  const billingAccount = await getOrCreateBillingAccount(
    userId,
    role,
    email,
    session?.user?.name ?? undefined
  );
  const stripeCustomerId = await ensureStripeCustomer(
    billingAccount,
    email,
    session?.user?.name ?? undefined
  );

  try {
    const checkoutSession = await createSubscriptionCheckoutSession({
      planCode: parsed.data.planCode,
      userId,
      userEmail: email,
      stripeCustomerId,
      billingAccountId: billingAccount.id,
    });

    await createAuditLog({
      actorUserId: userId,
      entityType: "Subscription",
      entityId: billingAccount.id,
      action: "checkout_session_created",
      after: { planCode: parsed.data.planCode, sessionId: checkoutSession.id },
    });

    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "SUBSCRIPTION_PRICE_NOT_CONFIGURED") {
      return NextResponse.json(
        { error: "Subscription price is not configured" },
        { status: 503 }
      );
    }
    throw e;
  }
}
