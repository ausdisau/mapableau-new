import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { createNotificationEvent } from "@/lib/access/notification-event-service";
import { notifyUser } from "@/lib/notifications/notification-service";
import { prisma } from "@/lib/prisma";

import { assertPlanManagerInvoiceAccess } from "./plan-manager-access-policy";

export async function markInvoiceProcessing(params: {
  invoiceId: string;
  planManagerId: string;
  actorUserId: string;
  reference?: string;
  notes?: string;
}) {
  const invoice = await assertPlanManagerInvoiceAccess(
    params.planManagerId,
    params.invoiceId
  );

  const record = await prisma.paymentProcessingRecord.create({
    data: {
      invoiceId: params.invoiceId,
      planManagerId: params.planManagerId,
      status: "processing",
      reference: params.reference,
      notes: params.notes,
    },
  });

  await prisma.planManagerInvoiceInbox.update({
    where: {
      invoiceId_planManagerId: {
        invoiceId: params.invoiceId,
        planManagerId: params.planManagerId,
      },
    },
    data: { status: "processing" },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "plan_manager.payment_processing",
    entityType: "Invoice",
    entityId: params.invoiceId,
    participantId: invoice.participantId,
    metadata: { status: "processing" },
  });

  return record;
}

export async function markInvoicePaid(params: {
  invoiceId: string;
  planManagerId: string;
  actorUserId: string;
  reference?: string;
  notes?: string;
}) {
  const invoice = await assertPlanManagerInvoiceAccess(
    params.planManagerId,
    params.invoiceId
  );

  const record = await prisma.paymentProcessingRecord.create({
    data: {
      invoiceId: params.invoiceId,
      planManagerId: params.planManagerId,
      status: "paid",
      processedAt: new Date(),
      reference: params.reference,
      notes: params.notes,
    },
  });

  await prisma.planManagerInvoiceInbox.update({
    where: {
      invoiceId_planManagerId: {
        invoiceId: params.invoiceId,
        planManagerId: params.planManagerId,
      },
    },
    data: { status: "paid" },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "plan_manager.payment_paid",
    entityType: "Invoice",
    entityId: params.invoiceId,
    participantId: invoice.participantId,
    metadata: { status: "paid", reference: params.reference },
  });

  await notifyUser(
    invoice.participantId,
    "billing",
    "Invoice marked as paid",
    "Your plan manager has updated the payment status for an invoice."
  );
  await createNotificationEvent({
    userId: invoice.participantId,
    category: "billing",
    eventType: "payment_paid",
    title: "Invoice paid",
    body: "Payment status updated by plan manager.",
    entityType: "Invoice",
    entityId: params.invoiceId,
    participantId: invoice.participantId,
  });

  return record;
}

export async function getPaymentStatus(
  invoiceId: string,
  planManagerId: string
) {
  return prisma.paymentProcessingRecord.findFirst({
    where: { invoiceId, planManagerId },
    orderBy: { updatedAt: "desc" },
  });
}
