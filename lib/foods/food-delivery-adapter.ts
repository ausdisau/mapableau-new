import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { createBooking } from "@/lib/bookings/booking-service";
import { createTransportBooking } from "@/lib/transport/transport-booking-service";
import { prisma } from "@/lib/prisma";

/**
 * Schedules food delivery via MapAble Transport adapter (partner kitchen MVP).
 */
export async function scheduleFoodDeliveryViaTransport(params: {
  foodOrderId: string;
  participantId: string;
  actorUserId: string;
  scheduledAt: Date;
  deliveryAddress: string;
  pickupAddress?: string;
}) {
  const order = await prisma.foodOrder.findUniqueOrThrow({
    where: { id: params.foodOrderId },
    include: { items: true },
  });

  const booking = await createBooking({
    participantId: params.participantId,
    createdById: params.actorUserId,
    bookingType: "transport",
    requestedStart: params.scheduledAt.toISOString(),
    pickupAddress: params.pickupAddress ?? "Partner kitchen — address on file",
    dropoffAddress: params.deliveryAddress,
    status: "requested",
    shareAccessibility: false,
  });

  const tb = await createTransportBooking({
    participantId: params.participantId,
    pickupAddress: params.pickupAddress ?? "Partner kitchen",
    dropoffAddress: params.deliveryAddress,
    pickupWindowStart: params.scheduledAt,
    pickupNotes: `MapAble Foods order ${params.foodOrderId}`,
    status: "requested",
  });

  await prisma.foodDeliveryRun.upsert({
    where: { foodOrderId: params.foodOrderId },
    create: {
      foodOrderId: params.foodOrderId,
      scheduledAt: params.scheduledAt,
      status: "planned",
    },
    update: {
      scheduledAt: params.scheduledAt,
      status: "planned",
    },
  });

  await prisma.foodOrder.update({
    where: { id: params.foodOrderId },
    data: {
      bookingId: booking.id,
      transportBookingId: tb.id,
      deliveryScheduledAt: params.scheduledAt,
      deliveryAddress: params.deliveryAddress,
      status: "scheduled",
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "foods.delivery.scheduled",
    entityType: "FoodOrder",
    entityId: params.foodOrderId,
    participantId: params.participantId,
    metadata: { transportBookingId: tb.id, bookingId: booking.id },
  });

  return { booking, transportBooking: tb };
}
