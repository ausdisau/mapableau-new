import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  canGenerateInvoiceFromServiceLog,
} from "@/lib/service-logs/service-log-service";
import { prisma } from "@/lib/prisma";

export async function generateInvoiceFromServiceLog(
  serviceLogId: string,
  createdById: string,
  lineAmountCents = 10000
) {
  const log = await prisma.serviceLog.findUnique({
    where: { id: serviceLogId },
    include: { booking: true },
  });
  if (!log) throw new Error("NOT_FOUND");
  if (!canGenerateInvoiceFromServiceLog(log.status)) {
    throw new Error("SERVICE_LOG_NOT_APPROVED");
  }

  const existing = await prisma.invoice.findFirst({
    where: { serviceLogId },
  });
  if (existing) return existing;

  const invoice = await prisma.invoice.create({
    data: {
      participantId: log.participantId,
      organisationId: log.organisationId,
      bookingId: log.bookingId,
      serviceLogId: log.id,
      status: "draft",
      participantApprovalStatus: "awaiting_participant_approval",
      subtotalCents: lineAmountCents,
      totalCents: lineAmountCents,
      createdById,
      notes:
        "Plain-language summary: this invoice is for support on the date shown. MapAble does not confirm NDIS funding approval.",
      lines: {
        create: {
          description: `${log.serviceSummary} (support delivered — not NDIS funding approval)`,
          serviceDate: log.serviceDate,
          quantity: 1,
          unitAmountCents: lineAmountCents,
          totalAmountCents: lineAmountCents,
          supportItemCode: log.supportItemCode ?? undefined,
        },
      },
    },
    include: { lines: true },
  });

  await prisma.billingEvent.create({
    data: {
      invoiceId: invoice.id,
      serviceLogId: log.id,
      participantId: log.participantId,
      organisationId: log.organisationId,
      eventType: "invoice_generated",
      metadata: { totalCents: lineAmountCents },
    },
  });

  await createAuditEvent({
    actorUserId: createdById,
    action: "booking.updated",
    entityType: "Invoice",
    entityId: invoice.id,
    participantId: log.participantId,
    organisationId: log.organisationId,
  });

  return invoice;
}

export async function participantApproveInvoice(
  invoiceId: string,
  participantId: string
) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice || invoice.participantId !== participantId) {
    throw new Error("FORBIDDEN");
  }

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      participantApprovalStatus: "approved",
      status: "approved_for_invoicing",
    },
  });

  await prisma.invoiceParticipantApproval.upsert({
    where: { invoiceId },
    create: { invoiceId, participantId, approvedAt: new Date() },
    update: { approvedAt: new Date(), disputedAt: null },
  });

  await prisma.billingEvent.create({
    data: {
      invoiceId,
      participantId,
      eventType: "invoice_approved",
    },
  });

  await createAuditEvent({
    actorUserId: participantId,
    action: "booking.updated",
    entityType: "Invoice",
    entityId: invoiceId,
    participantId,
  });

  return updated;
}

export async function participantDisputeInvoice(
  invoiceId: string,
  participantId: string,
  reason: string
) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice || invoice.participantId !== participantId) {
    throw new Error("FORBIDDEN");
  }

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { participantApprovalStatus: "disputed" },
  });

  await prisma.invoiceDispute.create({
    data: { invoiceId, reason },
  });

  await prisma.invoiceParticipantApproval.upsert({
    where: { invoiceId },
    create: {
      invoiceId,
      participantId,
      disputedAt: new Date(),
      disputeReason: reason,
    },
    update: {
      disputedAt: new Date(),
      disputeReason: reason,
    },
  });

  await prisma.billingEvent.create({
    data: {
      invoiceId,
      participantId,
      eventType: "invoice_disputed",
      metadata: { reason },
    },
  });

  return updated;
}
