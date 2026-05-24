import { phase3Config } from "@/lib/config/phase3";
import { createInvoiceDraftFromBooking } from "@/lib/invoices/invoice-service";
import { prisma } from "@/lib/prisma";

export async function createInvoiceFromCompletedTransport(
  transportBookingId: string,
  adminUserId: string,
) {
  if (!phase3Config.orchestrationEnabled) {
    return { skipped: true };
  }

  const key = `invoice-transport-${transportBookingId}`;
  const existing = await prisma.orchestrationEvent.findUnique({
    where: { idempotencyKey: key },
  });
  if (existing) return { duplicate: true };

  const tb = await prisma.transportBooking.findUnique({
    where: { id: transportBookingId },
  });
  if (!tb || tb.status !== "completed") {
    throw new Error("TRANSPORT_NOT_COMPLETED");
  }

  let invoice = tb.bookingId
    ? await prisma.invoice.findFirst({ where: { bookingId: tb.bookingId } })
    : null;

  if (!invoice && tb.bookingId) {
    invoice = await createInvoiceDraftFromBooking(tb.bookingId, adminUserId);
  } else if (!invoice) {
    invoice = await prisma.invoice.create({
      data: {
        participantId: tb.participantId,
        organisationId: tb.operatorOrganisationId,
        status: "draft",
        createdById: adminUserId,
        lines: {
          create: [
            {
              description: "Completed transport trip",
              serviceDate: tb.pickupWindowStart,
              quantity: 1,
              unitAmountCents: 0,
              totalAmountCents: 0,
            },
          ],
        },
      },
    });
  }

  await prisma.orchestrationEvent.create({
    data: {
      eventType: "invoice_from_transport_booking",
      transportBookingId,
      bookingId: tb.bookingId,
      idempotencyKey: key,
      createdById: adminUserId,
      metadata: { invoiceId: invoice.id },
    },
  });

  return { invoice };
}
