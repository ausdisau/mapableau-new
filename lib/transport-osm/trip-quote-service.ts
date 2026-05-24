import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { transportOsmConfig } from "@/lib/transport-osm/config";
import { geocodeAddress } from "@/lib/transport-osm/location-service";
import { getRoutingProvider } from "@/lib/transport-osm/routing";
import { transitionTripStatus } from "@/lib/transport-osm/trip-status-service";
import type { FareBreakdown, RouteSummaryPublic } from "@/types/transport-osm";

function computeFare(distanceMeters: number): FareBreakdown {
  const km = distanceMeters / 1000;
  const baseCents = transportOsmConfig.baseFareCents;
  const distanceCents = Math.round(km * transportOsmConfig.perKmCents);
  const totalCents = baseCents + distanceCents;
  return {
    baseCents,
    distanceCents,
    currency: "AUD",
    totalCents,
  };
}

export async function createTripQuote(
  transportBookingId: string,
  actorUserId: string
) {
  const booking = await prisma.transportBooking.findUnique({
    where: { id: transportBookingId },
  });
  if (!booking) throw new Error("NOT_FOUND");

  let pickupLat = booking.pickupLat;
  let pickupLng = booking.pickupLng;
  let dropoffLat = booking.dropoffLat;
  let dropoffLng = booking.dropoffLng;

  if (pickupLat == null || pickupLng == null) {
    const g = await geocodeAddress(booking.pickupAddress);
    pickupLat = g.lat;
    pickupLng = g.lng;
  }
  if (dropoffLat == null || dropoffLng == null) {
    const g = await geocodeAddress(booking.dropoffAddress);
    dropoffLat = g.lat;
    dropoffLng = g.lng;
  }

  await prisma.transportBooking.update({
    where: { id: transportBookingId },
    data: { pickupLat, pickupLng, dropoffLat, dropoffLng },
  });

  const provider = getRoutingProvider();
  const route = await provider.route({
    coordinates: [
      { lat: pickupLat, lng: pickupLng },
      { lat: dropoffLat, lng: dropoffLng },
    ],
    wheelchairAccessible: Boolean(
      (booking.vehicleRequirements as { requiresWheelchairAccessible?: boolean })
        ?.requiresWheelchairAccessible
    ),
  });

  const fare = computeFare(route.distanceMeters);
  const expiresAt = new Date(
    Date.now() + transportOsmConfig.quoteTtlMinutes * 60 * 1000
  );

  const routeSummary: RouteSummaryPublic = {
    distanceKm: Math.round((route.distanceMeters / 1000) * 10) / 10,
    durationMinutes: Math.ceil(route.durationSeconds / 60),
    provider: route.provider,
  };

  const plan = await prisma.routePlan.create({
    data: {
      transportBookingId,
      status: "generated",
      routingProvider: provider.name as never,
      encodedPolyline: route.encodedPolyline,
      distanceMeters: route.distanceMeters,
      durationSeconds: route.durationSeconds,
      createdById: actorUserId,
      legs: {
        create: route.legs.map((leg, i) => ({
          sequence: i + 1,
          fromLat: leg.from.lat,
          fromLng: leg.from.lng,
          toLat: leg.to.lat,
          toLng: leg.to.lng,
          distanceMeters: leg.distanceMeters,
          durationSeconds: leg.durationSeconds,
          encodedPolyline: leg.encodedPolyline,
        })),
      },
    },
  });

  const quote = await prisma.transportTripQuote.create({
    data: {
      transportBookingId,
      status: "active",
      distanceMeters: route.distanceMeters,
      durationSeconds: route.durationSeconds,
      fareBreakdown: fare as object,
      routeSummary: routeSummary as object,
      routingProvider: provider.name as never,
      providerRequestId: route.providerRequestId,
      expiresAt,
    },
  });

  await prisma.transportBooking.update({
    where: { id: transportBookingId },
    data: {
      quotedFareCents: fare.totalCents,
      quoteExpiresAt: expiresAt,
      selectedRoutePlanId: plan.id,
    },
  });

  if (booking.status === "draft" || booking.status === "quote_requested") {
    await transitionTripStatus({
      transportBookingId,
      toStatus: "quoted",
      actorUserId,
      reason: "quote_generated",
    });
  }

  await createAuditEvent({
    actorUserId,
    action: "transport.quote_created",
    entityType: "TransportTripQuote",
    entityId: quote.id,
    participantId: booking.participantId,
  });

  return { quote, plan, routeSummary, fare };
}

export async function confirmTripQuote(
  transportBookingId: string,
  actorUserId: string
) {
  const quote = await prisma.transportTripQuote.findFirst({
    where: { transportBookingId, status: "active" },
    orderBy: { createdAt: "desc" },
  });
  if (!quote) throw new Error("QUOTE_NOT_FOUND");
  if (quote.expiresAt && quote.expiresAt < new Date()) {
    await prisma.transportTripQuote.update({
      where: { id: quote.id },
      data: { status: "expired" },
    });
    throw new Error("QUOTE_EXPIRED");
  }

  await prisma.transportTripQuote.update({
    where: { id: quote.id },
    data: { status: "accepted" },
  });

  return transitionTripStatus({
    transportBookingId,
    toStatus: "participant_confirmed",
    actorUserId,
    reason: "quote_confirmed",
  });
}
