import type { InvoiceStatus } from "@prisma/client";
import type { z } from "zod";

import { createInvoiceDraftFromBooking } from "@/lib/invoices/invoice-service";
import { generateInvoiceNumber } from "@/lib/billing/invoice-number-service";
import { requestParticipantApproval, approveInvoice } from "@/lib/billing/invoice-approval-service";
import { assertInvoiceAccess } from "@/lib/billing/invoice-access-service";
import { recordBillingEvent } from "@/lib/billing/invoice-event-service";
import {
  amountDueForStripe,
  calculateInvoiceTotals,
  calculateLineTotal,
} from "@/lib/billing/invoice-total-service";
import { phase2Config } from "@/lib/config/phase2";
import { prisma } from "@/lib/prisma";
import type { createInvoiceSchema } from "@/types/billing";
import type { CurrentUser } from "@/lib/auth/current-user";

type CreateInput = z.infer<typeof createInvoiceSchema>;

function lineCreates(input: CreateInput["lines"]) {
  return input.map((l) => {
    const totalAmountCents = calculateLineTotal({
      quantity: l.quantity,
      unitAmountCents: l.unitAmountCents,
      privatePayAmountCents: l.privatePayAmountCents,
    });
    return {
      description: l.description,
      plainDescription: l.plainDescription,
      serviceDate: new Date(l.serviceDate),
      quantity: l.quantity,
      unitAmountCents: l.unitAmountCents,
      totalAmountCents,
      supportItemCode: l.supportItemCode,
      claimableByNdis: l.claimableByNdis ?? false,
      privatePayAmountCents: l.privatePayAmountCents,
      ndisClaimableAmountCents: l.ndisClaimableAmountCents,
      taxCode: l.taxCode,
      xeroAccountCode: l.xeroAccountCode,
      xeroTaxType: l.xeroTaxType,
    };
  });
}

export async function createInvoiceFromBooking(
  bookingId: string,
  createdById: string
) {
  const invoice = await createInvoiceDraftFromBooking(bookingId, createdById);
  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      sourceType: "booking",
      sourceId: bookingId,
      serviceType: "care",
    },
  });
  await recordBillingEvent({
    invoiceId: invoice.id,
    eventType: "created",
    toStatus: "draft",
    actorUserId: createdById,
    participantId: invoice.participantId,
    auditAction: "billing.invoice_from_booking",
  });
  return invoice;
}

export async function createInvoiceFromServiceLog(
  careShiftId: string,
  createdById: string
) {
  const shift = await prisma.careShift.findUnique({
    where: { id: careShiftId },
    include: { careRequest: true },
  });
  if (!shift) throw new Error("SERVICE_LOG_NOT_FOUND");
  if (shift.status !== "completed" && shift.status !== "approved") {
    throw new Error("SERVICE_NOT_COMPLETED");
  }

  const existing = await prisma.invoice.findFirst({
    where: { sourceType: "care_shift", sourceId: careShiftId },
  });
  if (existing) return existing;

  const lines = [
    {
      description: `Care shift — ${shift.careRequest?.supportItemCode ?? "support"}`,
      plainDescription: "Support session from your care booking.",
      serviceDate: shift.endAt ?? shift.startAt,
      quantity: 1,
      unitAmountCents: 0,
      totalAmountCents: 0,
      supportItemCode: shift.careRequest?.supportItemCode ?? undefined,
      claimableByNdis: Boolean(shift.careRequest?.supportItemCode),
    },
  ];
  const totals = calculateInvoiceTotals(
    lines.map((l) => ({ quantity: 1, unitAmountCents: l.unitAmountCents }))
  );

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: await generateInvoiceNumber(shift.organisationId),
      participantId: shift.participantId,
      organisationId: shift.organisationId,
      bookingId: shift.bookingId ?? undefined,
      status: "draft",
      serviceType: "care",
      sourceType: "care_shift",
      sourceId: careShiftId,
      currency: phase2Config.billingDefaultCurrency,
      createdById,
      subtotalCents: totals.subtotalCents,
      taxCents: totals.taxCents,
      totalCents: totals.totalCents,
      privatePayCents: totals.privatePayCents,
      requiresParticipantApproval: true,
      lines: { create: lines },
    },
    include: { lines: true },
  });

  await recordBillingEvent({
    invoiceId: invoice.id,
    eventType: "created",
    toStatus: "draft",
    actorUserId: createdById,
    participantId: invoice.participantId,
    auditAction: "billing.invoice_from_service_log",
  });

  return invoice;
}

export async function createInvoiceFromTransportTrip(
  transportBookingId: string,
  createdById: string
) {
  const trip = await prisma.transportBooking.findUnique({
    where: { id: transportBookingId },
  });
  if (!trip) throw new Error("TRANSPORT_NOT_FOUND");
  if (trip.status !== "completed") throw new Error("TRANSPORT_NOT_COMPLETED");

  const existing = await prisma.invoice.findFirst({
    where: { sourceType: "transport_booking", sourceId: transportBookingId },
  });
  if (existing) return existing;

  const line = {
    description: "Transport trip",
    plainDescription: "Transport support trip.",
    serviceDate: trip.pickupWindowStart,
    quantity: 1,
    unitAmountCents: 0,
    totalAmountCents: 0,
    claimableByNdis: false,
  };

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: await generateInvoiceNumber(trip.operatorOrganisationId),
      participantId: trip.participantId,
      organisationId: trip.operatorOrganisationId,
      status: "draft",
      serviceType: "transport",
      sourceType: "transport_booking",
      sourceId: transportBookingId,
      currency: phase2Config.billingDefaultCurrency,
      createdById,
      requiresParticipantApproval: true,
      lines: { create: [line] },
    },
    include: { lines: true },
  });

  await recordBillingEvent({
    invoiceId: invoice.id,
    eventType: "created",
    toStatus: "draft",
    actorUserId: createdById,
    participantId: invoice.participantId,
    auditAction: "billing.invoice_from_transport",
  });

  return invoice;
}

export async function createInvoiceFromHomeModificationProject(
  projectId: string,
  createdById: string,
  participantId: string,
  organisationId: string,
  lines: CreateInput["lines"]
) {
  const totals = calculateInvoiceTotals(
    lines.map((l) => ({
      quantity: l.quantity,
      unitAmountCents: l.unitAmountCents,
      privatePayAmountCents: l.privatePayAmountCents,
    }))
  );

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: await generateInvoiceNumber(organisationId),
      participantId,
      organisationId,
      status: "draft",
      serviceType: "home_modifications",
      sourceType: "home_modification_project",
      sourceId: projectId,
      currency: phase2Config.billingDefaultCurrency,
      createdById,
      subtotalCents: totals.subtotalCents,
      taxCents: totals.taxCents,
      totalCents: totals.totalCents,
      privatePayCents: totals.privatePayCents,
      requiresParticipantApproval: true,
      lines: { create: lineCreates(lines) },
    },
    include: { lines: true },
  });

  await recordBillingEvent({
    invoiceId: invoice.id,
    eventType: "created",
    toStatus: "draft",
    actorUserId: createdById,
    participantId,
    auditAction: "billing.invoice_from_home_mod",
  });

  return invoice;
}

export { calculateInvoiceTotals, amountDueForStripe };

export async function issueInvoice(invoiceId: string, actorUserId: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) throw new Error("INVOICE_NOT_FOUND");
  if (invoice.requiresParticipantApproval && invoice.status !== "approved") {
    throw new Error("APPROVAL_REQUIRED");
  }

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: "issued",
      issuedAt: new Date(),
      issueDate: new Date(),
    },
  });

  await recordBillingEvent({
    invoiceId,
    eventType: "issued",
    fromStatus: invoice.status,
    toStatus: "issued",
    actorUserId,
    participantId: invoice.participantId,
    auditAction: "invoice.issued",
  });

  return updated;
}

export async function disputeInvoice(
  invoiceId: string,
  raisedByUserId: string,
  reason: string
) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) throw new Error("INVOICE_NOT_FOUND");

  await prisma.invoiceDispute.create({
    data: { invoiceId, raisedByUserId, reason, status: "open" },
  });

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "disputed" },
  });

  await recordBillingEvent({
    invoiceId,
    eventType: "disputed",
    fromStatus: invoice.status,
    toStatus: "disputed",
    actorUserId: raisedByUserId,
    participantId: invoice.participantId,
    auditAction: "invoice.disputed",
    message: reason,
  });

  return updated;
}

export async function voidInvoiceBilling(
  invoiceId: string,
  actorUserId: string
) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) throw new Error("INVOICE_NOT_FOUND");

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "void" },
  });

  await recordBillingEvent({
    invoiceId,
    eventType: "voided",
    fromStatus: invoice.status,
    toStatus: "void",
    actorUserId,
    participantId: invoice.participantId,
    auditAction: "invoice.voided",
  });

  return updated;
}

export async function markManualPayment(
  invoiceId: string,
  actorUserId: string,
  amountCents: number,
  notes?: string
) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) throw new Error("INVOICE_NOT_FOUND");

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: amountCents >= invoice.totalCents ? "paid" : "partially_paid",
      paidAt: new Date(),
    },
  });

  await recordBillingEvent({
    invoiceId,
    eventType: "manual_payment",
    fromStatus: invoice.status,
    toStatus: updated.status,
    actorUserId,
    participantId: invoice.participantId,
    auditAction: "invoice.manual_payment",
    message: notes,
    metadata: { amountCents, mfaPlaceholder: true },
  });

  return updated;
}

export async function listInvoicesForUser(user: CurrentUser) {
  if (user.primaryRole === "participant" || user.roles.includes("participant")) {
    return prisma.invoice.findMany({
      where: { participantId: user.id },
      include: { lines: true, xeroSyncRecords: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  const orgIds = (
    await prisma.organisationMember.findMany({
      where: { userId: user.id },
      select: { organisationId: true },
    })
  ).map((m) => m.organisationId);

  return prisma.invoice.findMany({
    where: { organisationId: { in: orgIds } },
    include: { lines: true, xeroSyncRecords: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getInvoiceDetail(user: CurrentUser, invoiceId: string) {
  await assertInvoiceAccess(user, invoiceId);
  return prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      lines: true,
      billingEvents: { orderBy: { createdAt: "desc" }, take: 20 },
      approvals: true,
      disputes: true,
      stripePaymentRecords: { orderBy: { createdAt: "desc" } },
      xeroSyncRecords: { orderBy: { createdAt: "desc" } },
    },
  });
}

export { approveInvoice, requestParticipantApproval };
