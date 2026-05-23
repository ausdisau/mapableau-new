import type { ReconciliationMatchStatus } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function createReconciliationBatch(
  periodStart: Date,
  periodEnd: Date,
  createdById: string
) {
  const batch = await prisma.paymentReconciliationBatch.create({
    data: { periodStart, periodEnd, createdById, status: "pending" },
  });

  const invoices = await prisma.invoice.findMany({
    where: { createdAt: { gte: periodStart, lte: periodEnd } },
    include: { participant: { select: { id: true } } },
  });

  const stripePayments = await prisma.stripePaymentIntentRecord.findMany({
    where: { createdAt: { gte: periodStart, lte: periodEnd } },
  });

  const xeroSyncs = await prisma.xeroInvoiceSyncRecord.findMany({
    where: { createdAt: { gte: periodStart, lte: periodEnd } },
  });

  for (const inv of invoices) {
    const stripe = stripePayments.find((p) => p.invoiceId === inv.id);
    const xero = xeroSyncs.find((x) => x.invoiceId === inv.id);
    let matchStatus: ReconciliationMatchStatus = "unmatched";
    if (stripe && xero) matchStatus = "matched";
    else if (stripe || xero) matchStatus = "partial";

    await prisma.paymentReconciliationException.create({
      data: {
        batchId: batch.id,
        invoiceId: inv.id,
        stripePaymentId: stripe?.stripePaymentIntentId,
        xeroInvoiceId: xero?.xeroInvoiceId ?? undefined,
        matchStatus,
        amountCents: stripe?.amountCents,
        notes:
          matchStatus === "unmatched"
            ? "No Stripe or Xero link found — requires review"
            : undefined,
      },
    });
  }

  for (const p of stripePayments.filter((s) => !s.invoiceId)) {
    await prisma.paymentReconciliationException.create({
      data: {
        batchId: batch.id,
        stripePaymentId: p.stripePaymentIntentId,
        matchStatus: "unmatched",
        amountCents: p.amountCents,
        notes: "Stripe payment without MapAble invoice",
      },
    });
  }

  await createAuditEvent({
    actorUserId: createdById,
    action: "reconciliation.batch_created",
    entityType: "PaymentReconciliationBatch",
    entityId: batch.id,
  });

  return batch;
}

export async function markExceptionReviewed(
  exceptionId: string,
  actorUserId: string
) {
  const ex = await prisma.paymentReconciliationException.update({
    where: { id: exceptionId },
    data: { matchStatus: "reviewed", notes: "Reviewed by admin" },
  });
  await createAuditEvent({
    actorUserId,
    action: "reconciliation.exception_reviewed",
    entityType: "PaymentReconciliationException",
    entityId: exceptionId,
  });
  return ex;
}

export async function getReconciliationDashboard() {
  const batches = await prisma.paymentReconciliationBatch.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { exceptions: true },
  });
  return { batches };
}
