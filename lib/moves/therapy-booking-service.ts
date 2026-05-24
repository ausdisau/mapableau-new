import { randomBytes } from "crypto";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { createBooking } from "@/lib/bookings/booking-service";
import { createTransportBooking } from "@/lib/transport/transport-booking-service";
import { prisma } from "@/lib/prisma";
import { logClinicalAudit } from "@/lib/moves/clinical-audit";

export async function createTherapyAppointment(params: {
  participantId: string;
  actorUserId: string;
  therapistProfileId: string;
  therapyType: string;
  deliveryMode: string;
  startsAt: Date;
  endsAt: Date;
  location?: string;
  transportRequired?: boolean;
}) {
  const therapist = await prisma.therapistProfile.findFirst({
    where: {
      id: params.therapistProfileId,
      active: true,
      credentialStatus: "verified",
    },
  });
  if (!therapist) throw new Error("THERAPIST_NOT_VERIFIED");

  const appointment = await prisma.therapyAppointment.create({
    data: {
      participantId: params.participantId,
      therapistProfileId: params.therapistProfileId,
      therapyType: params.therapyType as never,
      deliveryMode: params.deliveryMode as never,
      startsAt: params.startsAt,
      endsAt: params.endsAt,
      location: params.location,
      transportRequired: params.transportRequired ?? false,
      status: "requested",
    },
  });

  if (params.deliveryMode === "telehealth") {
    await prisma.telehealthSession.create({
      data: {
        therapyAppointmentId: appointment.id,
        secureLinkToken: randomBytes(32).toString("hex"),
        linkExpiresAt: new Date(params.endsAt.getTime() + 3600000),
      },
    });
  }

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "moves.appointment.created",
    entityType: "TherapyAppointment",
    entityId: appointment.id,
    participantId: params.participantId,
  });

  return appointment;
}

export async function confirmTherapyAppointment(
  appointmentId: string,
  actorUserId: string,
) {
  const appt = await prisma.therapyAppointment.update({
    where: { id: appointmentId },
    data: { status: "confirmed" },
  });

  const booking = await createBooking({
    participantId: appt.participantId,
    createdById: actorUserId,
    bookingType: "care",
    requestedStart: appt.startsAt.toISOString(),
    requestedEnd: appt.endsAt.toISOString(),
    careLocation: appt.location ?? undefined,
    status: "confirmed",
    shareAccessibility: false,
  });

  let transportBookingId: string | undefined;
  if (appt.transportRequired) {
    const tb = await createTransportBooking({
      participantId: appt.participantId,
      pickupAddress: "Home — confirm address in profile",
      dropoffAddress: appt.location ?? "Clinic — confirm with therapist",
      pickupWindowStart: new Date(appt.startsAt.getTime() - 3600000),
      status: "draft",
    });
    transportBookingId = tb.id;
  }

  await prisma.therapyAppointment.update({
    where: { id: appointmentId },
    data: { bookingId: booking.id, transportBookingId },
  });

  await createAuditEvent({
    actorUserId,
    action: "moves.appointment.confirmed",
    entityType: "TherapyAppointment",
    entityId: appointmentId,
    participantId: appt.participantId,
  });

  return appt;
}

export async function completeTherapyAppointment(
  appointmentId: string,
  actorUserId: string,
) {
  const appt = await prisma.therapyAppointment.update({
    where: { id: appointmentId },
    data: { status: "completed" },
  });
  await logClinicalAudit({
    entityType: "TherapyAppointment",
    entityId: appointmentId,
    action: "completed",
    actorUserId,
  });
  return appt;
}

export async function getTherapyAppointment(
  id: string,
  participantId?: string,
) {
  return prisma.therapyAppointment.findFirst({
    where: {
      id,
      ...(participantId ? { participantId } : {}),
    },
    include: {
      therapistProfile: true,
      telehealthSession: true,
      homeVisitRiskCheck: true,
      progressSummaries: { orderBy: { createdAt: "desc" }, take: 3 },
    },
  });
}
