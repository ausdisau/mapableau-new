import { phase3Config } from "@/lib/config/phase3";
import { createInvoiceDraftFromBooking } from "@/lib/invoices/invoice-service";
import { resolveInvoiceLinePricing } from "@/lib/ndis-pricing/price-lookup-service";
import { prisma } from "@/lib/prisma";

export async function createInvoiceLinesFromApprovedCareShift(
  shiftId: string,
  adminUserId: string
) {
  if (!phase3Config.orchestrationEnabled) {
    return { skipped: true };
  }

  const key = `invoice-shift-${shiftId}`;
  const existing = await prisma.orchestrationEvent.findUnique({
    where: { idempotencyKey: key },
  });
  if (existing) return { duplicate: true };

  const shift = await prisma.careShift.findUnique({
    where: { id: shiftId },
    include: { careRequest: true },
  });
  if (!shift || shift.status !== "approved") {
    throw new Error("SHIFT_NOT_APPROVED");
  }

  const pricing = await resolveInvoiceLinePricing({
    supportItemCode: shift.careRequest?.supportItemCode,
    description: shift.careRequest?.supportItemCode
      ? `Approved care shift — ${shift.careRequest.supportItemCode}`
      : "Approved care shift support",
  });

  let invoice = shift.bookingId
    ? await prisma.invoice.findFirst({ where: { bookingId: shift.bookingId } })
    : null;

  if (!invoice) {
    if (shift.bookingId) {
      invoice = await createInvoiceDraftFromBooking(
        shift.bookingId,
        adminUserId
      );
    } else {
      invoice = await prisma.invoice.create({
        data: {
          participantId: shift.participantId,
          organisationId: shift.organisationId,
          status: "draft",
          createdById: adminUserId,
          lines: {
            create: [
              {
                description: pricing.description,
                serviceDate: shift.startAt,
                quantity: 1,
                unitAmountCents: pricing.unitAmountCents,
                totalAmountCents: pricing.totalAmountCents,
                supportItemCode: pricing.supportItemCode,
                claimableByNdis: pricing.claimableByNdis,
              },
            ],
          },
        },
      });
    }
  } else {
    await prisma.invoiceLine.create({
      data: {
        invoiceId: invoice.id,
        description: pricing.description,
        serviceDate: shift.startAt,
        quantity: 1,
        unitAmountCents: pricing.unitAmountCents,
        totalAmountCents: pricing.totalAmountCents,
        supportItemCode: pricing.supportItemCode,
        claimableByNdis: pricing.claimableByNdis,
      },
    });
  }

  await prisma.orchestrationEvent.create({
    data: {
      eventType: "invoice_from_care_shift",
      careShiftId: shiftId,
      idempotencyKey: key,
      createdById: adminUserId,
      metadata: {
        invoiceId: invoice.id,
        pricingSource: pricing.pricingSource,
        unitAmountCents: pricing.unitAmountCents,
      },
    },
  });

  return { invoice, pricing };
}
