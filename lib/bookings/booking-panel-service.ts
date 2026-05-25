import type { PanelActor } from "@/lib/access-control/panel-access";
import {
  assertOrganisationAccess,
  assertParticipantSelfAccess,
} from "@/lib/access-control/panel-access";
import { assertProviderBookingEligible } from "@/lib/access-control/safety-gates";
import { createBooking } from "@/lib/bookings/booking-service";
import { prisma } from "@/lib/prisma";
import type { createBookingSchema } from "@/lib/validation/booking";
import type { z } from "zod";

type CreateInput = z.infer<typeof createBookingSchema>;

export async function listParticipantBookings(actor: PanelActor) {
  await assertParticipantSelfAccess(actor, actor.id, "Booking");
  return prisma.booking.findMany({
    where: { participantId: actor.id },
    orderBy: { requestedStart: "desc" },
    include: {
      assignedOrganisation: { select: { id: true, name: true } },
      timelineEvents: { orderBy: { createdAt: "desc" }, take: 3 },
    },
  });
}

export async function requestParticipantBooking(
  actor: PanelActor,
  input: CreateInput & { assignedOrganisationId?: string }
) {
  await assertParticipantSelfAccess(actor, actor.id, "Booking", "create");

  if (input.assignedOrganisationId) {
    await assertProviderBookingEligible(input.assignedOrganisationId);
  }

  return createBooking({
    ...input,
    participantId: actor.id,
    createdById: actor.id,
    status: "requested",
  });
}

export async function listProviderBookings(
  actor: PanelActor,
  organisationId: string
) {
  await assertOrganisationAccess(actor, organisationId, "Booking");
  return prisma.booking.findMany({
    where: { assignedOrganisationId: organisationId },
    orderBy: { requestedStart: "desc" },
    include: {
      participant: {
        select: { id: true, name: true, participantProfile: true },
      },
    },
  });
}
