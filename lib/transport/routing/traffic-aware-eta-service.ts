import type { TransportTrip } from "@prisma/client";

import { transportRoutingConfig } from "@/lib/config/transport-routing";
import { prisma } from "@/lib/prisma";
import type { CurrentUser } from "@/lib/auth/current-user";
import { deliverNotificationCloud } from "@/lib/notifications/notification-cloud";
import {
  latestConsentedDriverOrigin,
  stopLocationAcceptanceForTrip,
} from "@/lib/transport/privacy/driver-location-share";
import { boardingBufferSecondsForMobility } from "@/lib/transport/routing/boarding-buffer";
import { expireEstimatesForTrip } from "@/lib/transport/routing/route-cache-service";
import { createRouteEstimate } from "@/lib/transport/routing/route-estimate-service";
import { assertCanAccessTrip } from "@/lib/transport/transport-access-policy";
import { TransportApiError } from "@/lib/transport/transport-api-error";
import { recordTripEvent } from "@/lib/transport/transport-event-service";
import type { LatLng } from "@/types/transport-routing";
import { routingHonestyDisclaimer } from "@/types/transport-routing";

function requireEtaPilot() {
  if (!transportRoutingConfig.etaPilotEnabled) {
    throw new TransportApiError("TRANSPORT_ETA_PILOT_DISABLED");
  }
}

function tripOrigin(trip: TransportTrip): LatLng | null {
  if (trip.pickupLat == null || trip.pickupLng == null) return null;
  return { lat: trip.pickupLat, lng: trip.pickupLng };
}

function tripDestination(trip: TransportTrip): LatLng | null {
  if (trip.dropoffLat == null || trip.dropoffLng == null) return null;
  return { lat: trip.dropoffLat, lng: trip.dropoffLng };
}

export function composePickupEtaIso(params: {
  generatedAt: Date;
  travelDurationSeconds: number;
  boardingBufferSeconds: number;
  departAt?: Date | null;
}): string {
  const start = params.departAt ?? params.generatedAt;
  return new Date(
    start.getTime() +
      (params.travelDurationSeconds + params.boardingBufferSeconds) * 1000
  ).toISOString();
}

function hazardsFromEvidence(value: unknown) {
  if (!value || typeof value !== "object") return [];
  const hazards = (value as { hazards?: unknown }).hazards;
  if (!Array.isArray(hazards)) return [];
  return hazards.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const hazard = item as {
      id?: string;
      category?: string;
      headline?: string;
      subCategory?: string;
      distanceToRouteMetres?: number;
      distanceMetres?: number;
    };
    return [
      {
        id: hazard.id,
        category: hazard.category,
        headline: hazard.headline,
        subCategory: hazard.subCategory,
        distanceToRouteMetres:
          hazard.distanceToRouteMetres ?? hazard.distanceMetres,
      },
    ];
  });
}

export function presentRouteEstimate(
  estimate: {
    distanceMetres: number;
    durationSeconds: number;
    travelDurationSeconds?: number | null;
    boardingBufferSeconds?: number | null;
    provider: string;
    source?: string | null;
    trafficMode?: string | null;
    liveTrafficUsed?: boolean | null;
    providerStatus?: string | null;
    fallbackReason?: string | null;
    generatedAt?: Date | null;
    expiresAt?: Date | null;
    createdAt: Date;
    hazardEvidence?: unknown;
  },
  options?: { departAt?: Date | null }
) {
  const travel =
    estimate.travelDurationSeconds ?? estimate.durationSeconds;
  const boarding = estimate.boardingBufferSeconds ?? 0;
  const source =
    (estimate.source as "tomtom_orbis" | "osrm" | "mock" | null) ?? "mock";
  const liveTrafficUsed = Boolean(estimate.liveTrafficUsed);
  const generatedAt = estimate.generatedAt ?? estimate.createdAt;
  return {
    distanceMetres: estimate.distanceMetres,
    durationSeconds: travel + boarding,
    travelDurationSeconds: travel,
    boardingBufferSeconds: boarding,
    advisoryDisclaimer: routingHonestyDisclaimer({
      liveTrafficUsed,
      source: source === "tomtom_orbis" || source === "osrm" ? source : "mock",
    }),
    provider: estimate.provider,
    source,
    trafficMode: estimate.trafficMode,
    liveTrafficUsed,
    providerStatus: estimate.providerStatus ?? "ok",
    fallbackReason: estimate.fallbackReason,
    generatedAt: generatedAt.toISOString(),
    validUntil: estimate.expiresAt?.toISOString() ?? null,
    pickupEta: composePickupEtaIso({
      generatedAt,
      travelDurationSeconds: travel,
      boardingBufferSeconds: boarding,
      departAt: options?.departAt,
    }),
    hazards: hazardsFromEvidence(estimate.hazardEvidence),
  };
}

async function loadTrip(tripId: string) {
  const trip = await prisma.transportTrip.findUnique({ where: { id: tripId } });
  if (!trip) throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");
  return trip;
}

export async function getTripEta(user: CurrentUser, tripId: string) {
  requireEtaPilot();
  const trip = await loadTrip(tripId);
  await assertCanAccessTrip(user, trip, "summary");
  const estimate = await prisma.transportRouteEstimate.findFirst({
    where: {
      tripId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { createdAt: "desc" },
  });
  if (!estimate) {
    return { eta: null, advisoryOnly: true as const };
  }
  return {
    eta: presentRouteEstimate(estimate, { departAt: trip.scheduledStart }),
    advisoryOnly: true as const,
  };
}

export async function refreshTripEta(
  user: CurrentUser,
  tripId: string,
  options?: { origin?: LatLng; reroute?: boolean }
) {
  requireEtaPilot();
  const trip = await loadTrip(tripId);
  await assertCanAccessTrip(user, trip, "summary");

  const liveOrigin = options?.origin ?? (await latestConsentedDriverOrigin(tripId));
  const origin = liveOrigin ?? tripOrigin(trip);
  const destination = tripDestination(trip);
  if (!origin || !destination) {
    throw new TransportApiError(
      "TRANSPORT_ROUTE_NOT_FOUND",
      "This trip does not have coordinates needed for an ETA."
    );
  }

  if (options?.reroute) {
    await expireEstimatesForTrip(tripId);
  }

  const created = await createRouteEstimate({
    input: {
      origin,
      destination,
      departAt: options?.reroute
        ? new Date().toISOString()
        : trip.scheduledStart.toISOString(),
      includeGeometry: true,
    },
    tripId,
    boardingBufferSeconds: boardingBufferSecondsForMobility(
      trip.mobilityRequirements
    ),
  });

  await recordTripEvent({
    tripId,
    actorUserId: user.id,
    eventType: options?.reroute ? "eta_reroute_advisory" : "eta_refreshed",
    participantId: trip.participantId,
    organisationId: trip.providerOrganisationId ?? undefined,
    metadata: {
      estimateId: created.estimate.id,
      liveTrafficUsed: created.estimate.liveTrafficUsed,
      source: created.estimate.source,
      providerStatus: created.estimate.providerStatus,
    },
  });

  return {
    eta: presentRouteEstimate(created.estimate, {
      departAt: options?.reroute ? new Date() : trip.scheduledStart,
    }),
    advisoryDisclaimer: created.advisoryDisclaimer,
    trafficAdvisory: created.trafficAdvisory,
    fromCache: created.fromCache,
    requiresHumanReview: Boolean(options?.reroute),
    bookingUnchanged: true as const,
    advisoryOnly: true as const,
  };
}

export async function expireTripEstimatesAndNotify(params: {
  trip: TransportTrip;
  actorUserId: string;
  reason?: string;
}) {
  await expireEstimatesForTrip(params.trip.id);
  await stopLocationAcceptanceForTrip(params.trip.id);
  const title = "Transport trip cancelled";
  const body =
    "The trip was cancelled. Any earlier travel-time estimate is no longer current. This was not live traffic.";
  await deliverNotificationCloud({
    userId: params.trip.participantId,
    category: "booking",
    purpose: "transport_trip_cancelled",
    title,
    body,
  });

  const assignment = await prisma.transportDispatchAssignment.findFirst({
    where: { tripId: params.trip.id, active: true },
    include: { driver: true },
  });
  if (assignment?.driver?.userId) {
    await deliverNotificationCloud({
      userId: assignment.driver.userId,
      category: "booking",
      purpose: "transport_trip_cancelled",
      title,
      body,
    });
  }
  void params.reason;
  void params.actorUserId;
}
