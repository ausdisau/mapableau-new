import { phase4Config } from "@/lib/config/phase4";
import { checkConsent, grantConsent } from "@/lib/consent/consent-service";
import type { CurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { logDataAccess } from "@/lib/transport/data-access-log-service";
import {
  assertAssignedDriver,
  assertCanAccessTrip,
  getActiveAssignment,
} from "@/lib/transport/transport-access-policy";
import { TransportApiError } from "@/lib/transport/transport-api-error";
import { recordTripEvent } from "@/lib/transport/transport-event-service";
import type { LatLng } from "@/types/transport-routing";

const IN_SERVICE = new Set([
  "en_route_to_pickup",
  "arrived_at_pickup",
  "participant_boarded",
  "en_route_to_dropoff",
  "arrived_at_dropoff",
]);

export async function hasDriverLocationShareConsent(params: {
  participantId: string;
  driverUserId?: string | null;
  organisationId?: string | null;
}): Promise<boolean> {
  if (params.driverUserId) {
    const toDriver = await checkConsent({
      subjectUserId: params.participantId,
      scope: "transport.driver_location_share",
      grantedToUserId: params.driverUserId,
    });
    if (toDriver) return true;
  }
  if (params.organisationId) {
    return checkConsent({
      subjectUserId: params.participantId,
      scope: "transport.driver_location_share",
      grantedToOrganisationId: params.organisationId,
    });
  }
  return false;
}

export async function grantTripDriverLocationConsent(
  user: CurrentUser,
  tripId: string,
  granted: boolean
) {
  const trip = await prisma.transportTrip.findUnique({ where: { id: tripId } });
  if (!trip) throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");
  if (trip.participantId !== user.id) {
    throw new TransportApiError("TRANSPORT_ACCESS_DENIED");
  }
  if (!granted) {
    throw new TransportApiError(
      "TRANSPORT_VALIDATION_FAILED",
      "Withdraw location sharing from Consent settings."
    );
  }

  const assignment = await getActiveAssignment(tripId);
  const driverUserId = assignment?.driver?.userId;
  const organisationId = trip.providerOrganisationId ?? undefined;
  if (!driverUserId && !organisationId) {
    throw new TransportApiError(
      "TRANSPORT_VALIDATION_FAILED",
      "Location sharing can be granted after a driver or operator is assigned."
    );
  }

  await grantConsent({
    subjectUserId: user.id,
    grantedToUserId: driverUserId ?? undefined,
    grantedToOrganisationId: organisationId,
    scope: "transport.driver_location_share",
    purpose: "Share optional driver location during this transport trip",
    createdById: user.id,
    recipientType: driverUserId ? "worker" : "organisation",
  });

  await recordTripEvent({
    tripId,
    actorUserId: user.id,
    eventType: "driver_location_consent_granted",
    participantId: trip.participantId,
    organisationId,
  });

  return { granted: true };
}

export async function setDriverLocationOptIn(
  user: CurrentUser,
  tripId: string,
  optedIn: boolean
) {
  await assertAssignedDriver(user, tripId);
  const trip = await prisma.transportTrip.findUnique({ where: { id: tripId } });
  if (!trip) throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");
  const assignment = await getActiveAssignment(tripId);
  if (!assignment) throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");
  await prisma.transportDispatchAssignment.update({
    where: { id: assignment.id },
    data: { driverLocationShareOptedIn: optedIn },
  });
  await recordTripEvent({
    tripId,
    actorUserId: user.id,
    eventType: optedIn ? "driver_location_opt_in" : "driver_location_opt_out",
    participantId: trip.participantId,
    organisationId: assignment.organisationId,
  });
  return { optedIn };
}

export async function recordConsentedDriverLocation(
  user: CurrentUser,
  tripId: string,
  lat: number,
  lng: number
) {
  if (!phase4Config.transportLiveLocationEnabled) {
    throw new TransportApiError("TRANSPORT_LOCATION_SHARE_DISABLED");
  }
  const driver = await assertAssignedDriver(user, tripId);
  const trip = await prisma.transportTrip.findUnique({ where: { id: tripId } });
  if (!trip) throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");
  if (!IN_SERVICE.has(trip.status)) {
    throw new TransportApiError("TRANSPORT_ACCESS_DENIED");
  }
  const assignment = await getActiveAssignment(tripId);
  if (!assignment?.driverLocationShareOptedIn) {
    throw new TransportApiError("TRANSPORT_LOCATION_SHARE_DISABLED");
  }
  const consented = await hasDriverLocationShareConsent({
    participantId: trip.participantId,
    driverUserId: user.id,
    organisationId: trip.providerOrganisationId,
  });
  if (!consented) {
    throw new TransportApiError(
      "TRANSPORT_CONSENT_REQUIRED",
      "The participant has not consented to optional driver location sharing."
    );
  }

  await prisma.transportLiveLocation.create({
    data: { tripId, driverId: driver.id, lat, lng },
  });
  await recordTripEvent({
    tripId,
    actorUserId: user.id,
    eventType: "location_update",
    metadata: { recorded: true },
    participantId: trip.participantId,
    organisationId: trip.providerOrganisationId ?? undefined,
  });
  return { ok: true };
}

export async function getSharedDriverLocation(
  user: CurrentUser,
  tripId: string
): Promise<{ location: LatLng | null; exact: boolean }> {
  if (!phase4Config.transportLiveLocationEnabled) {
    throw new TransportApiError("TRANSPORT_LOCATION_SHARE_DISABLED");
  }
  const trip = await prisma.transportTrip.findUnique({ where: { id: tripId } });
  if (!trip) throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");
  await assertCanAccessTrip(user, trip, "summary");

  const isParticipant = trip.participantId === user.id;
  const assignment = await getActiveAssignment(tripId);
  const isAssignedDriver = assignment?.driver?.userId === user.id;
  if (!isParticipant && !isAssignedDriver) {
    throw new TransportApiError("TRANSPORT_ACCESS_DENIED");
  }

  const consented = await hasDriverLocationShareConsent({
    participantId: trip.participantId,
    driverUserId: assignment?.driver?.userId,
    organisationId: trip.providerOrganisationId,
  });
  if (!consented) {
    throw new TransportApiError(
      "TRANSPORT_CONSENT_REQUIRED",
      "Driver location is only available when the participant has consented to sharing."
    );
  }

  const latest = await prisma.transportLiveLocation.findFirst({
    where: { tripId },
    orderBy: { recordedAt: "desc" },
  });
  if (!latest) return { location: null, exact: false };

  await logDataAccess({
    actor: user,
    resourceType: "TransportLiveLocation",
    resourceId: latest.id,
    accessType: "location_stream",
    participantId: trip.participantId,
    organisationId: trip.providerOrganisationId ?? undefined,
    metadata: { exact: isParticipant || isAssignedDriver },
  });

  return {
    location: { lat: latest.lat, lng: latest.lng },
    exact: isParticipant || isAssignedDriver,
  };
}

export async function latestConsentedDriverOrigin(
  tripId: string
): Promise<LatLng | null> {
  if (!phase4Config.transportLiveLocationEnabled) return null;
  const trip = await prisma.transportTrip.findUnique({ where: { id: tripId } });
  if (!trip || !IN_SERVICE.has(trip.status)) return null;
  const assignment = await getActiveAssignment(tripId);
  if (!assignment?.driverLocationShareOptedIn) return null;
  const consented = await hasDriverLocationShareConsent({
    participantId: trip.participantId,
    driverUserId: assignment.driver?.userId,
    organisationId: trip.providerOrganisationId,
  });
  if (!consented) return null;
  const latest = await prisma.transportLiveLocation.findFirst({
    where: { tripId },
    orderBy: { recordedAt: "desc" },
  });
  if (!latest) return null;
  return { lat: latest.lat, lng: latest.lng };
}

export async function stopLocationAcceptanceForTrip(tripId: string) {
  await prisma.transportDispatchAssignment.updateMany({
    where: { tripId, active: true },
    data: { driverLocationShareOptedIn: false },
  });
}
