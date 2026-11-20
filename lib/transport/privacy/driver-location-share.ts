import type { CurrentUser } from "@/lib/auth/current-user";
import { phase4Config } from "@/lib/config/phase4";
import { grantConsent } from "@/lib/consent/consent-service";
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

export const DRIVER_LOCATION_IN_SERVICE_STATUSES = new Set([
  "en_route_to_pickup",
  "arrived_at_pickup",
  "participant_boarded",
  "en_route_to_dropoff",
  "arrived_at_dropoff",
]);

export function driverLocationShareSourceAction(tripId: string): string {
  return `transport.trip:${tripId}`;
}

export function isDriverLocationInServiceStatus(status: string): boolean {
  return DRIVER_LOCATION_IN_SERVICE_STATUSES.has(status);
}

function locationShareExpiry(trip: {
  scheduledStart: Date;
  scheduledEnd?: Date | null;
}): Date {
  if (trip.scheduledEnd) {
    return new Date(trip.scheduledEnd.getTime() + 2 * 60 * 60 * 1000);
  }
  return new Date(trip.scheduledStart.getTime() + 24 * 60 * 60 * 1000);
}

export async function hasDriverLocationShareConsent(params: {
  participantId: string;
  tripId: string;
  driverUserId?: string | null;
}): Promise<boolean> {
  if (!params.driverUserId) return false;
  const now = new Date();
  const record = await prisma.consentRecord.findFirst({
    where: {
      subjectUserId: params.participantId,
      scope: "transport_driver_location_share",
      status: "active",
      grantedToUserId: params.driverUserId,
      sourceAction: driverLocationShareSourceAction(params.tripId),
      OR: [{ expiryDate: null }, { expiryDate: { gt: now } }],
    },
  });
  return Boolean(record);
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
  if (!driverUserId) {
    throw new TransportApiError(
      "TRANSPORT_VALIDATION_FAILED",
      "Location sharing can be granted after a driver is assigned to this trip."
    );
  }

  const sourceAction = driverLocationShareSourceAction(tripId);
  const existing = await prisma.consentRecord.findFirst({
    where: {
      subjectUserId: user.id,
      scope: "transport_driver_location_share",
      status: "active",
      grantedToUserId: driverUserId,
      sourceAction,
      OR: [{ expiryDate: null }, { expiryDate: { gt: new Date() } }],
    },
  });
  if (existing) {
    return { granted: true };
  }

  await grantConsent({
    subjectUserId: user.id,
    grantedToUserId: driverUserId,
    scope: "transport.driver_location_share",
    purpose: "Share optional driver location during this transport trip",
    createdById: user.id,
    recipientType: "worker",
    dataScope: [tripId],
    sourceAction,
    expiryDate: locationShareExpiry(trip),
    recordDisclosureOnGrant: false,
  });

  await recordTripEvent({
    tripId,
    actorUserId: user.id,
    eventType: "driver_location_consent_granted",
    participantId: trip.participantId,
    organisationId: trip.providerOrganisationId ?? undefined,
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
  if (!isDriverLocationInServiceStatus(trip.status)) {
    throw new TransportApiError("TRANSPORT_ACCESS_DENIED");
  }
  const assignment = await getActiveAssignment(tripId);
  if (!assignment?.driverLocationShareOptedIn) {
    throw new TransportApiError("TRANSPORT_LOCATION_SHARE_DISABLED");
  }
  const consented = await hasDriverLocationShareConsent({
    participantId: trip.participantId,
    tripId,
    driverUserId: user.id,
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

  if (!isDriverLocationInServiceStatus(trip.status)) {
    throw new TransportApiError("TRANSPORT_LOCATION_SHARE_DISABLED");
  }

  const assignment = await getActiveAssignment(tripId);
  const isParticipant = trip.participantId === user.id;
  const isAssignedDriver = assignment?.driver?.userId === user.id;
  if (!isParticipant && !isAssignedDriver) {
    throw new TransportApiError("TRANSPORT_ACCESS_DENIED");
  }
  if (!assignment?.driverLocationShareOptedIn || !assignment.driver?.userId) {
    throw new TransportApiError("TRANSPORT_LOCATION_SHARE_DISABLED");
  }

  const consented = await hasDriverLocationShareConsent({
    participantId: trip.participantId,
    tripId,
    driverUserId: assignment.driver.userId,
  });
  if (!consented) {
    throw new TransportApiError(
      "TRANSPORT_CONSENT_REQUIRED",
      "Driver location is only available when the participant has consented to sharing."
    );
  }

  const latest = await prisma.transportLiveLocation.findFirst({
    where: { tripId, driverId: assignment.driverId },
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
  if (!trip || !isDriverLocationInServiceStatus(trip.status)) return null;
  const assignment = await getActiveAssignment(tripId);
  if (!assignment?.driverLocationShareOptedIn || !assignment.driver?.userId) {
    return null;
  }
  const consented = await hasDriverLocationShareConsent({
    participantId: trip.participantId,
    tripId,
    driverUserId: assignment.driver.userId,
  });
  if (!consented) return null;
  const latest = await prisma.transportLiveLocation.findFirst({
    where: { tripId, driverId: assignment.driverId },
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

export async function expireDriverLocationShareConsent(tripId: string) {
  await prisma.consentRecord.updateMany({
    where: {
      sourceAction: driverLocationShareSourceAction(tripId),
      status: "active",
    },
    data: { status: "expired", expiryDate: new Date() },
  });
}
