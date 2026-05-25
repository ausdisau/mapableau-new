import type { InvoiceStatus } from "@prisma/client";

import { recordBillingEvent } from "@/lib/billing/invoice-event-service";
import { prisma } from "@/lib/prisma";

export async function requestParticipantApproval(
  invoiceId: string,
  approverUserId: string,
  actorUserId: string
) {
  const approval = await prisma.invoiceApproval.create({
    data: {
      invoiceId,
      approverUserId,
      approverRole: "participant",
      status: "pending",
    },
  });

  const invoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "awaiting_participant_approval", requiresParticipantApproval: true },
  });

  await recordBillingEvent({
    invoiceId,
    eventType: "approval_requested",
    fromStatus: "draft",
    toStatus: "awaiting_participant_approval" as InvoiceStatus,
    actorUserId,
    participantId: invoice.participantId,
    auditAction: "invoice.approval_requested",
  });

  return { approval, invoice };
}

export async function approveInvoice(
  invoiceId: string,
  approverUserId: string,
  notes?: string
) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) throw new Error("INVOICE_NOT_FOUND");

  await prisma.invoiceApproval.updateMany({
    where: { invoiceId, approverUserId, status: "pending" },
    data: { status: "approved", notes, decidedAt: new Date() },
  });

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "approved" },
  });

  await recordBillingEvent({
    invoiceId,
    eventType: "approved",
    fromStatus: invoice.status,
    toStatus: "approved",
    actorUserId: approverUserId,
    participantId: invoice.participantId,
    auditAction: "invoice.approved",
    message: notes,
  });

  return updated;
}
