import type { CurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import {
  buildUberGuestFromProfile,
  cancelUberGuestTrip,
  createUberGuestTrip,
  getUberGuestTrip,
  getUberGuestTripEstimates,
} from "@/lib/uber/guest";
import { isUberIntegrationEnabled } from "@/lib/uber/config";
import { UberApiError } from "@/lib/uber/errors";
import { assertCanAccessTrip } from "@/lib/transport/transport-access-policy";
import { recordTripEvent } from "@/lib/transport/transport-event-service";
import { TransportApiError } from "@/lib/transport/transport-api-error";

function requireCoordinates(
  lat: number | null | undefined,
  lng: number | null | undefined,
  label: string
): { latitude: number; longitude: number } {
  if (lat == null || lng == null) {
    throw new TransportApiError(
      "TRANSPORT_VALIDATION_FAILED",
      `${label} coordinates are required for Uber Guest Rides`
    );
  }
  return { latitude: lat, longitude: lng };
}

export function assertUberEnabled() {
  if (!isUberIntegrationEnabled()) {
    throw new UberApiError(
      "Uber Guest Rides integration is disabled",
      503,
      "UBER_NOT_CONFIGURED"
    );
  }
}

export async function getUberEstimatesForTransportTrip(
  user: CurrentUser,
  tripId: string
) {
  assertUberEnabled();
  const trip = await prisma.transportTrip.findUnique({
    where: { id: tripId },
    include: { participant: true },
  });
  if (!trip) throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");
  await assertCanAccessTrip(user, trip);

  const pickup = requireCoordinates(trip.pickupLat, trip.pickupLng, "Pickup");
  const dropoff = requireCoordinates(trip.dropoffLat, trip.dropoffLng, "Dropoff");

  const estimates = await getUberGuestTripEstimates({
    pickup,
    dropoff,
    scheduling: { pickup_time: trip.scheduledStart.getTime() },
  });

  return { tripId, estimates };
}

export async function dispatchUberGuestTripForTransportTrip(
  user: CurrentUser,
  tripId: string,
  options?: { productId?: string; fareId?: string }
) {
  assertUberEnabled();
  const trip = await prisma.transportTrip.findUnique({
    where: { id: tripId },
    include: { participant: true },
  });
  if (!trip) throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");
  await assertCanAccessTrip(user, trip);

  const participant = trip.participant;
  let guest;
  try {
    guest = buildUberGuestFromProfile({
      name: participant.name,
      email: participant.email,
      phone: participant.phone,
    });
  } catch {
    throw new TransportApiError(
      "TRANSPORT_VALIDATION_FAILED",
      "Participant phone number is required in E.164 format for Uber Guest Rides"
    );
  }

  const pickup = requireCoordinates(trip.pickupLat, trip.pickupLng, "Pickup");
  const dropoff = requireCoordinates(trip.dropoffLat, trip.dropoffLng, "Dropoff");

  const uberTrip = await createUberGuestTrip({
    guest,
    pickup: { ...pickup, address: trip.pickupAddress },
    dropoff: { ...dropoff, address: trip.dropoffAddress },
    product_id: options?.productId,
    fare_id: options?.fareId,
    scheduling: { pickup_time: trip.scheduledStart.getTime() },
    note_for_driver: trip.accessNotes ?? undefined,
    sender_display_name: "MapAble",
  });

  await recordTripEvent({
    tripId: trip.id,
    actorUserId: user.id,
    eventType: "uber_guest_trip_created",
    message: "Uber Guest Ride requested",
    metadata: {
      uberRequestId: uberTrip.request_id,
      uberStatus: uberTrip.status,
      productId: options?.productId,
    },
    participantId: trip.participantId,
    organisationId: trip.providerOrganisationId ?? undefined,
  });

  return { tripId, uberTrip };
}

export async function syncUberGuestTripStatus(
  user: CurrentUser,
  tripId: string,
  uberRequestId: string
) {
  assertUberEnabled();
  const trip = await prisma.transportTrip.findUnique({ where: { id: tripId } });
  if (!trip) throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");
  await assertCanAccessTrip(user, trip);

  const uberTrip = await getUberGuestTrip(uberRequestId);

  await recordTripEvent({
    tripId,
    actorUserId: user.id,
    eventType: "uber_guest_trip_synced",
    message: `Uber trip status: ${uberTrip.status ?? "unknown"}`,
    metadata: {
      uberRequestId,
      uberStatus: uberTrip.status,
      uberStatusDetail: uberTrip.status_detail,
    },
    participantId: trip.participantId,
    organisationId: trip.providerOrganisationId ?? undefined,
  });

  return { tripId, uberTrip };
}

export async function cancelUberGuestTripForTransportTrip(
  user: CurrentUser,
  tripId: string,
  uberRequestId: string
) {
  assertUberEnabled();
  const trip = await prisma.transportTrip.findUnique({ where: { id: tripId } });
  if (!trip) throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");
  await assertCanAccessTrip(user, trip);

  await cancelUberGuestTrip(uberRequestId);

  await recordTripEvent({
    tripId,
    actorUserId: user.id,
    eventType: "uber_guest_trip_cancelled",
    message: "Uber Guest Ride cancelled",
    metadata: { uberRequestId },
    participantId: trip.participantId,
    organisationId: trip.providerOrganisationId ?? undefined,
  });

  return { tripId, uberRequestId, cancelled: true };
}
