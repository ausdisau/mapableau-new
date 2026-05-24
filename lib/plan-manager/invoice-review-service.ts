import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { createNotificationEvent } from "@/lib/access/notification-event-service";
import { notifyUser } from "@/lib/notifications/notification-service";
import { prisma } from "@/lib/prisma";

import {
  assertPlanManagerInvoiceAccess,
  hasPlanManagerAccess,
} from "./plan-manager-access-policy";
import { syncInvoiceToInbox } from "./plan-manager-service";

export async function reviewInvoice(params: {
  invoiceId: string;
  planManagerId: string;
  actorUserId: string;
  status: "in_review" | "needs_information" | "approved" | "rejected";
  notes?: string;
}) {
  const invoice = await assertPlanManagerInvoiceAccess(
    params.planManagerId,
    params.invoiceId
  );

  await syncInvoiceToInbox({
    invoiceId: params.invoiceId,
    planManagerId: params.planManagerId,
    participantId: invoice.participantId,
  });

  const inboxStatus =
    params.status === "approved"
      ? "approved"
      : params.status === "needs_information"
        ? "needs_information"
        : params.status === "rejected"
          ? "disputed"
          : "in_review";

  const inbox = await prisma.planManagerInvoiceInbox.update({
    where: {
      invoiceId_planManagerId: {
        invoiceId: params.invoiceId,
        planManagerId: params.planManagerId,
      },
    },
    data: { status: inboxStatus },
  });

  await prisma.invoiceReviewEvent.create({
    data: {
      invoiceId: params.invoiceId,
      planManagerId: params.planManagerId,
      actorUserId: params.actorUserId,
      eventType: "review",
      previousStatus: inbox.status,
      newStatus: inboxStatus,
      notes: params.notes,
    },
  });

  const reviewStatus =
    params.status === "approved"
      ? "approved_for_payment"
      : params.status === "rejected"
        ? "rejected"
        : "in_review";

  const existingReview = await prisma.planManagerInvoiceReview.findFirst({
    where: {
      invoiceId: params.invoiceId,
      planManagerId: params.planManagerId,
    },
  });
  if (existingReview) {
    await prisma.planManagerInvoiceReview.update({
      where: { id: existingReview.id },
      data: { status: reviewStatus, notes: params.notes },
    });
  } else {
    await prisma.planManagerInvoiceReview.create({
      data: {
        invoiceId: params.invoiceId,
        planManagerId: params.planManagerId,
        status: reviewStatus,
        notes: params.notes,
      },
    });
  }

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "plan_manager.invoice_reviewed",
    entityType: "Invoice",
    entityId: params.invoiceId,
    participantId: invoice.participantId,
    metadata: { status: params.status },
  });

  await notifyUser(
    invoice.participantId,
    "billing",
    "Invoice reviewed by plan manager",
    `Your plan manager updated the review status to ${inboxStatus}.`
  );
  await createNotificationEvent({
    userId: invoice.participantId,
    category: "billing",
    eventType: "invoice_reviewed",
    title: "Invoice reviewed",
    body: `Status: ${inboxStatus}`,
    entityType: "Invoice",
    entityId: params.invoiceId,
    participantId: invoice.participantId,
  });

  return inbox;
}

export async function disputeInvoice(params: {
  invoiceId: string;
  planManagerId: string;
  actorUserId: string;
  reason: string;
}) {
  const invoice = await assertPlanManagerInvoiceAccess(
    params.planManagerId,
    params.invoiceId
  );

  const inbox = await prisma.planManagerInvoiceInbox.update({
    where: {
      invoiceId_planManagerId: {
        invoiceId: params.invoiceId,
        planManagerId: params.planManagerId,
      },
    },
    data: { status: "disputed" },
  });

  await prisma.invoiceReviewEvent.create({
    data: {
      invoiceId: params.invoiceId,
      planManagerId: params.planManagerId,
      actorUserId: params.actorUserId,
      eventType: "dispute",
      newStatus: "disputed",
      notes: params.reason,
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "plan_manager.invoice_disputed",
    entityType: "Invoice",
    entityId: params.invoiceId,
    participantId: invoice.participantId,
    metadata: { reason: params.reason },
  });

  return inbox;
}

export async function getExportReadyInvoiceData(
  planManagerId: string,
  invoiceId: string
) {
  await assertPlanManagerInvoiceAccess(planManagerId, invoiceId);

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { lines: true, organisation: true },
  });
  if (!invoice) throw new Error("NOT_FOUND");

  return {
    invoiceNumber: invoice.invoiceNumber,
    issueDate: invoice.issueDate,
    totalCents: invoice.totalCents,
    lines: invoice.lines,
    provider: invoice.organisation?.name,
    disclaimer: "Export for your records. Not an NDIA claim submission.",
  };
}
