import { NextResponse } from "next/server";

import { auth } from "@/app/lib/auth";
import { getOrCreateBillingAccount, ensureStripeCustomer } from "@/lib/billing/accounts";
import { createAuditLog } from "@/lib/billing/audit";
import { requireAuthUserId, isAuthError } from "@/lib/billing/auth";
import {
  createInvoiceCheckoutSession,
  getProviderConnectedAccountId,
} from "@/lib/billing/checkout";
import { resolveCheckoutDecision } from "@/lib/billing/funding";
import {
  createPendingPaymentForCheckout,
  createPaymentSplitsForInvoice,
} from "@/lib/billing/webhooks";
import { prisma } from "@/lib/prisma";
import { checkoutSchema } from "@/schemas/billing.types";

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

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: parsed.data.invoiceId, userId },
    include: { fundingSource: true },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (invoice.status === "paid") {
    return NextResponse.json({ error: "Invoice already paid" }, { status: 409 });
  }

  const decision = resolveCheckoutDecision(invoice.fundingSource?.type);

  if (decision.action === "plan_manager_export") {
    return NextResponse.json({
      checkoutBlocked: true,
      action: "plan_manager_export",
      message: decision.message,
      invoiceId: invoice.id,
    });
  }

  if (decision.action !== "stripe_checkout") {
    return NextResponse.json({ error: decision.message }, { status: 400 });
  }

  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ error: "User email required" }, { status: 400 });
  }

  const billingAccount = await getOrCreateBillingAccount(
    userId,
    "participant",
    email,
    session?.user?.name ?? undefined
  );
  const stripeCustomerId = await ensureStripeCustomer(
    billingAccount,
    email,
    session?.user?.name ?? undefined
  );

  const providerAccountId = await getProviderConnectedAccountId(
    invoice.providerId,
    userId
  );

  const checkoutSession = await createInvoiceCheckoutSession({
    invoice,
    userId,
    userEmail: email,
    stripeCustomerId,
    providerConnectedAccountId: providerAccountId,
  });

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      status: "pending_payment",
      stripeCheckoutSessionId: checkoutSession.id,
    },
  });

  const payment = await createPendingPaymentForCheckout({
    invoiceId: invoice.id,
    userId,
    providerId: invoice.providerId,
    amountCents: invoice.totalCents,
    currency: invoice.currency,
    stripeCheckoutSessionId: checkoutSession.id,
    method: providerAccountId ? "stripe_connect" : "stripe_checkout",
  });

  await createPaymentSplitsForInvoice({
    paymentId: payment.id,
    invoice: {
      providerId: invoice.providerId,
      platformFeeCents: invoice.platformFeeCents,
      totalCents: invoice.totalCents,
    },
    providerConnectedAccountId: providerAccountId,
  });

  await createAuditLog({
    actorUserId: userId,
    entityType: "Invoice",
    entityId: invoice.id,
    action: "checkout_session_created",
    after: { stripeCheckoutSessionId: checkoutSession.id },
  });

  return NextResponse.json({
    url: checkoutSession.url,
    sessionId: checkoutSession.id,
  });
}
