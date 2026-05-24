import { prisma } from "@/lib/prisma";
import type { CareBundleView } from "@/types/care";
import { CARE_STATUS_LABELS } from "@/types/care";
import { TRANSPORT_STATUS_LABELS } from "@/types/transport";

export async function getCareRequestBundle(
  careRequestId: string,
): Promise<CareBundleView> {
  const request = await prisma.careRequest.findUniqueOrThrow({
    where: { id: careRequestId },
  });

  let linkedTransport: CareBundleView["linkedTransport"] = null;

  const orch = await prisma.orchestrationEvent.findFirst({
    where: {
      careRequestId,
      eventType: "care_transport_link_created",
    },
    orderBy: { createdAt: "desc" },
  });

  const transportId = orch?.transportBookingId;
  if (transportId) {
    const tb = await prisma.transportBooking.findUnique({
      where: { id: transportId },
    });
    if (tb) {
      linkedTransport = {
        id: tb.id,
        status: TRANSPORT_STATUS_LABELS[tb.status] ?? tb.status,
        pickupAddress: tb.pickupAddress,
        dropoffAddress: tb.dropoffAddress,
      };
    }
  }

  return {
    careRequest: {
      id: request.id,
      title: request.title,
      requestType: request.requestType,
      status: request.status,
      preferredDate: request.preferredDate?.toISOString() ?? null,
      bookingId: request.bookingId,
      linkedTransportRequired: request.linkedTransportRequired,
    },
    bookingId: request.bookingId,
    linkedTransport,
  };
}

export function plainLanguageCareStatus(status: string): string {
  return (
    CARE_STATUS_LABELS[status as keyof typeof CARE_STATUS_LABELS] ?? status
  );
}
