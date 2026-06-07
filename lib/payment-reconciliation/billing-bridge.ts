import type { ReconciliationMatchStatus } from "@prisma/client";

import { RECONCILIATION_AMOUNT_TOLERANCE_CENTS } from "@/lib/config/y2-orchestration";
import { prisma } from "@/lib/prisma";

function matchBillingInvoiceToStripe(
  invoiceTotalCents: number,
  stripeAmountCents: number | null | undefined
): { matchStatus: ReconciliationMatchStatus; reasonCode: string | null } {
  if (stripeAmountCents == null) {
    return { matchStatus: "unmatched", reasonCode: "NO_BILLING_PAYMENT" };
  }
  const diff = Math.abs(stripeAmountCents - invoiceTotalCents);
  if (diff <= RECONCILIATION_AMOUNT_TOLERANCE_CENTS) {
    return { matchStatus: "matched", reasonCode: null };
  }
  return { matchStatus: "partial", reasonCode: "AMOUNT_MISMATCH" };
}

export async function reconcileBillingInvoicesInBatch(params: {
  batchId: string;
  periodStart: Date;
  periodEnd: Date;
  organisationId?: string;
}) {
  const billingInvoices = await prisma.billingInvoice.findMany({
    where: {
      createdAt: { gte: params.periodStart, lte: params.periodEnd },
      ...(params.organisationId ? { providerId: params.organisationId } : {}),
    },
    include: { payments: true },
  });

  let matched = 0;
  let unmatched = 0;

  for (const inv of billingInvoices) {
    const payment = inv.payments.find((p) => p.status === "succeeded");
    const result = matchBillingInvoiceToStripe(
      inv.totalCents,
      payment?.amountCents
    );

    if (result.matchStatus === "matched") matched++;
    else unmatched++;

    await prisma.paymentReconciliationException.create({
      data: {
        batchId: params.batchId,
        billingInvoiceId: inv.id,
        stripePaymentId: payment?.stripePaymentIntentId ?? undefined,
        matchStatus: result.matchStatus,
        reasonCode: result.reasonCode ?? undefined,
        organisationId: inv.providerId ?? params.organisationId,
        amountCents: payment?.amountCents ?? inv.totalCents,
        workflowState: result.matchStatus === "matched" ? "resolved" : "open",
        notes:
          result.matchStatus === "unmatched"
            ? "Billing invoice without succeeded Stripe payment"
            : result.reasonCode ?? undefined,
      },
    });
  }

  return { matched, unmatched, billingInvoiceCount: billingInvoices.length };
}
