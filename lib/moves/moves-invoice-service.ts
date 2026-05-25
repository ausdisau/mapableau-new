import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { phase2Config } from "@/lib/config/phase2";
import { prisma } from "@/lib/prisma";

export async function createInvoiceFromTherapyAppointment(
  appointmentId: string,
  actorUserId: string,
) {
  const appt = await prisma.therapyAppointment.findUniqueOrThrow({
    where: { id: appointmentId },
    include: { therapistProfile: true },
  });

  if (appt.status !== "completed") {
    throw new Error("APPOINTMENT_NOT_COMPLETED");
  }

  const invoice = await prisma.invoice.create({
    data: {
      participantId: appt.participantId,
      bookingId: appt.bookingId,
      organisationId: appt.therapistProfile.organisationId,
      status: "draft",
      currency: phase2Config.billingDefaultCurrency,
      createdById: actorUserId,
      lines: {
        create: [
          {
            description: `${appt.therapyType.replace(/_/g, " ")} session — ${appt.deliveryMode.replace(/_/g, " ")}`,
            serviceDate: appt.startsAt,
            quantity: 1,
            unitAmountCents: 0,
            totalAmountCents: 0,
            claimableByNdis: false,
          },
        ],
      },
    },
  });

  await prisma.therapyAppointment.update({
    where: { id: appointmentId },
    data: { invoiceId: invoice.id },
  });

  await createAuditEvent({
    actorUserId,
    action: "moves.invoice.created",
    entityType: "Invoice",
    entityId: invoice.id,
    participantId: appt.participantId,
    metadata: { appointmentId },
  });

  return invoice;
}
