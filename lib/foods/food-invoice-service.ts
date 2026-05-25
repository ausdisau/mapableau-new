import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { phase2Config } from "@/lib/config/phase2";
import { prisma } from "@/lib/prisma";

export async function createInvoiceFromFoodOrder(
  foodOrderId: string,
  actorUserId: string,
) {
  const order = await prisma.foodOrder.findUniqueOrThrow({
    where: { id: foodOrderId },
    include: { invoiceSplit: true },
  });

  if (!order.invoiceSplit) {
    throw new Error("INVOICE_SPLIT_MISSING");
  }

  const split = order.invoiceSplit;

  const invoice = await prisma.invoice.create({
    data: {
      participantId: order.participantId,
      bookingId: order.bookingId,
      status: "draft",
      currency: phase2Config.billingDefaultCurrency,
      subtotalCents: split.totalCents,
      totalCents: split.totalCents,
      notes: split.plainLanguageNote ?? undefined,
      createdById: actorUserId,
      lines: {
        create: [
          {
            description: "Food order — ingredients",
            serviceDate: new Date(),
            quantity: 1,
            unitAmountCents: split.ingredientCents,
            totalAmountCents: split.ingredientCents,
            claimableByNdis: false,
          },
          {
            description: "Food order — preparation",
            serviceDate: new Date(),
            quantity: 1,
            unitAmountCents: split.preparationCents,
            totalAmountCents: split.preparationCents,
            claimableByNdis: false,
          },
          {
            description: "Food order — delivery",
            serviceDate: new Date(),
            quantity: 1,
            unitAmountCents: split.deliveryCents,
            totalAmountCents: split.deliveryCents,
            claimableByNdis: false,
          },
        ],
      },
    },
  });

  await prisma.foodInvoiceSplit.update({
    where: { foodOrderId },
    data: { invoiceId: invoice.id },
  });

  await createAuditEvent({
    actorUserId,
    action: "foods.invoice.created",
    entityType: "Invoice",
    entityId: invoice.id,
    participantId: order.participantId,
    metadata: { foodOrderId },
  });

  return invoice;
}
