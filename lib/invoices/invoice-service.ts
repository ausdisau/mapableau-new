import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { runBillingPreflight } from "@/lib/billing/preflight";
import { recordBookingTimelineEvent } from "@/lib/bookings/timeline-service";
import { phase2Config } from "@/lib/config/phase2";
import {
  assertInvoiceTransition,
  toPrismaInvoiceStatus,
} from "@/lib/domain/invoice-status";
import {
  calculateInvoiceTotals,
  generateInvoiceNumber,
} from "@/lib/invoices/invoice-calculations";
import {
  onInvoiceApproved,
  onInvoiceCreatedFromBooking,
  onInvoiceIssued,
  onInvoicePaid,
} from "@/lib/orchestration/invoice-orchestrator";
import { prisma } from "@/lib/prisma";

async function recalculateAndPersistInvoice(invoiceId: string) {
  const lines = await prisma.invoiceLine.findMany({ where: { invoiceId } });
  const totals = calculateInvoiceTotals(
    lines.map((l) => ({
      quantity: Number(l.quantity),
      unitAmountCents: l.unitAmountCents,
      claimableByNdis: l.claimableByNdis,
      gstApplicable: l.gstApplicable,
      ndisClaimableAmountCents: l.ndisClaimableAmountCents,
      privatePayAmountCents: l.privatePayAmountCents,
    }))
  );

  return prisma.invoice.update({
    where: { id: invoiceId },
    data: totals,
    include: { lines: true },
  });
}

export async function createInvoiceDraftFromBooking(
  bookingId: string,
  createdById: string
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { assignedOrganisation: true },
  });
  if (!booking) throw new Error("BOOKING_NOT_FOUND");
  if (booking.status !== "completed" && booking.status !== "invoiced") {
    throw new Error("BOOKING_NOT_READY_FOR_INVOICE");
  }

  const unitCents =
    booking.actualTotalCents ?? booking.estimatedTotalCents ?? 0;
  const claimable = Boolean(booking.ndisLineItem || booking.ndisSupportCategory);

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: generateInvoiceNumber(),
      participantId: booking.participantId,
      organisationId: booking.assignedOrganisationId,
      bookingId: booking.id,
      fundingSourceId: booking.fundingSourceId,
      status: "draft",
      currency: phase2Config.billingDefaultCurrency,
      createdById,
      subtotalCents: unitCents,
      taxCents: 0,
      totalCents: unitCents,
      ndisClaimableCents: claimable ? unitCents : 0,
      participantGapCents: claimable ? 0 : unitCents,
      lines: {
        create: [
          {
            description: `Support service — ${booking.bookingType.replace("_", " ")}`,
            serviceDate: booking.actualEndAt ?? booking.requestedStart,
            quantity: 1,
            unitAmountCents: unitCents,
            totalAmountCents: unitCents,
            supportItemCode: booking.ndisLineItem ?? undefined,
            ndisSupportCategory: booking.ndisSupportCategory ?? undefined,
            claimableByNdis: claimable,
            ndisClaimableAmountCents: claimable ? unitCents : 0,
            privatePayAmountCents: claimable ? 0 : unitCents,
          },
        ],
      },
    },
    include: { lines: true },
  });

  await recalculateAndPersistInvoice(invoice.id);

  await createAuditEvent({
    actorUserId: createdById,
    action: "invoice.created",
    entityType: "Invoice",
    entityId: invoice.id,
    participantId: booking.participantId,
  });

  await onInvoiceCreatedFromBooking({
    invoiceId: invoice.id,
    bookingId,
    actorUserId: createdById,
  });

  return prisma.invoice.findUnique({
    where: { id: invoice.id },
    include: { lines: true },
  });
}

export async function issueInvoice(
  invoiceId: string,
  actorUserId: string,
  dueInDays = 14
) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) throw new Error("INVOICE_NOT_FOUND");

  assertInvoiceTransition(invoice.status, "issued");

  const now = new Date();
  const due = new Date(now);
  due.setDate(due.getDate() + dueInDays);

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: "issued",
      issuedAt: now,
      issueDate: now,
      dueDate: due,
    },
    include: { lines: true },
  });

  await createAuditEvent({
    actorUserId,
    action: "invoice.issued",
    entityType: "Invoice",
    entityId: invoiceId,
    participantId: invoice.participantId,
  });

  await onInvoiceIssued({ invoiceId, actorUserId });

  return updated;
}

export async function approveInvoice(
  invoiceId: string,
  actorUserId: string,
  approvedByRole: "participant" | "family_member" | "plan_manager"
) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) throw new Error("INVOICE_NOT_FOUND");

  const nextStatus =
    approvedByRole === "plan_manager"
      ? "awaiting_plan_manager"
      : "awaiting_plan_manager";

  assertInvoiceTransition(invoice.status, nextStatus);

  const updated = await onInvoiceApproved({
    invoiceId,
    actorUserId,
    nextStatus,
  });

  return updated;
}

export async function markInvoicePaid(
  invoiceId: string,
  actorUserId: string
) {
  return onInvoicePaid({ invoiceId, actorUserId });
}

export async function updateInvoiceStatus(
  invoiceId: string,
  status: string,
  actorUserId: string
) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) throw new Error("INVOICE_NOT_FOUND");

  assertInvoiceTransition(invoice.status, status);

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: toPrismaInvoiceStatus(status as never) },
  });

  await createAuditEvent({
    actorUserId,
    action: "invoice.status_changed",
    entityType: "Invoice",
    entityId: invoiceId,
    participantId: invoice.participantId,
    metadata: { status },
  });

  if (status === "paid" || updated.status === "paid") {
    await onInvoicePaid({ invoiceId, actorUserId });
  }

  return updated;
}

export async function runAndStorePreflight(
  invoiceId: string,
  createdById: string
) {
  const outcome = await runBillingPreflight(invoiceId);

  const result = await prisma.billingPreflightResult.create({
    data: {
      invoiceId,
      status: outcome.status,
      checks: outcome.checks,
      failedReasons: outcome.failedReasons,
      createdById,
    },
  });

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status:
        outcome.status === "passed"
          ? "awaiting_participant_approval"
          : "preflight_failed",
    },
  });

  await createAuditEvent({
    actorUserId: createdById,
    action: "invoice.preflight",
    entityType: "Invoice",
    entityId: invoiceId,
    metadata: { status: outcome.status },
  });

  return { result, outcome };
}

export async function voidInvoice(invoiceId: string, actorUserId: string) {
  return updateInvoiceStatus(invoiceId, "void", actorUserId);
}

export { recalculateAndPersistInvoice };
