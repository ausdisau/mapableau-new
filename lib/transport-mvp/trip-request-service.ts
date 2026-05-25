import { checkConsent } from "@/lib/consent/consent-service";
import { prisma } from "@/lib/prisma";

import { recordTransportTripEvent } from "./trip-events";

function extractSuburb(address: string): string | null {
  const parts = address.split(",").map((p) => p.trim());
  if (parts.length >= 2) return parts[parts.length - 2] ?? null;
  return null;
}

export async function createTransportTripRequest(params: {
  participantId: string;
  pickupAddress: string;
  dropoffAddress: string;
  pickupWindowStart: Date;
  pickupWindowEnd?: Date;
  pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
  pickupNotes?: string;
  dropoffNotes?: string;
  passengerCount?: number;
  organisationId?: string;
  wheelchairRequired?: boolean;
  assistedPickup?: boolean;
  assistedDropoff?: boolean;
  driverAssistanceRequired?: boolean;
  mobilityAidsJson?: object;
  assistanceNotes?: string;
  shareAccessibility?: boolean;
  shareAccessibilityConfirmed?: boolean;
}) {
  if (params.shareAccessibility && params.shareAccessibilityConfirmed) {
    const orgId = params.organisationId;
    const ok = orgId
      ? await checkConsent({
          subjectUserId: params.participantId,
          scope: "transport.accessibility_share",
          grantedToOrganisationId: orgId,
        })
      : await checkConsent({
          subjectUserId: params.participantId,
          scope: "transport.accessibility_share",
        });
    if (!ok) throw new Error("CONSENT_REQUIRED");
  }

  const request = await prisma.transportTripRequest.create({
    data: {
      participantId: params.participantId,
      organisationId: params.organisationId,
      status: "requested",
      pickupAddress: params.pickupAddress,
      dropoffAddress: params.dropoffAddress,
      pickupLat: params.pickupLat,
      pickupLng: params.pickupLng,
      dropoffLat: params.dropoffLat,
      dropoffLng: params.dropoffLng,
      pickupWindowStart: params.pickupWindowStart,
      pickupWindowEnd: params.pickupWindowEnd,
      pickupNotes: params.pickupNotes,
      dropoffNotes: params.dropoffNotes,
      passengerCount: params.passengerCount ?? 1,
      accessNeeds: {
        create: {
          wheelchairRequired: params.wheelchairRequired ?? false,
          assistedPickup: params.assistedPickup ?? false,
          assistedDropoff: params.assistedDropoff ?? false,
          driverAssistanceRequired: params.driverAssistanceRequired ?? false,
          mobilityAidsJson: params.mobilityAidsJson,
          assistanceNotes: params.assistanceNotes,
          shareAccessibility: params.shareAccessibility ?? false,
        },
      },
    },
    include: { accessNeeds: true },
  });

  return request;
}

export async function listParticipantTripRequests(participantId: string) {
  return prisma.transportTripRequest.findMany({
    where: { participantId },
    orderBy: { createdAt: "desc" },
    include: { trip: true, accessNeeds: true },
  });
}

export async function listParticipantTrips(participantId: string) {
  return prisma.transportTrip.findMany({
    where: { participantId },
    orderBy: { createdAt: "desc" },
    include: { request: true, dispatch: true, evidence: true },
  });
}

export async function getParticipantTripDetail(tripId: string, participantId: string) {
  const trip = await prisma.transportTrip.findFirst({
    where: { id: tripId, participantId },
    include: {
      stops: { orderBy: { sequence: "asc" } },
      accessNeeds: true,
      events: { orderBy: { createdAt: "asc" } },
      evidence: true,
      dispatch: { include: { driver: true, vehicle: true } },
      request: true,
    },
  });
  if (!trip) throw new Error("NOT_FOUND");
  return trip;
}

export async function ensureTripStopsFromRequest(tripId: string, requestId: string) {
  const existing = await prisma.transportTripStop.count({ where: { tripId } });
  if (existing > 0) return;

  const request = await prisma.transportTripRequest.findUnique({
    where: { id: requestId },
  });
  if (!request) return;

  await prisma.transportTripStop.createMany({
    data: [
      {
        tripId,
        sequence: 0,
        stopType: "pickup",
        addressFull: request.pickupAddress,
        addressSuburb: extractSuburb(request.pickupAddress),
        lat: request.pickupLat,
        lng: request.pickupLng,
        scheduledAt: request.pickupWindowStart,
        notes: request.pickupNotes,
      },
      {
        tripId,
        sequence: 1,
        stopType: "dropoff",
        addressFull: request.dropoffAddress,
        addressSuburb: extractSuburb(request.dropoffAddress),
        lat: request.dropoffLat,
        lng: request.dropoffLng,
        notes: request.dropoffNotes,
      },
    ],
  });
}

export async function copyAccessNeedsToTrip(requestId: string, tripId: string) {
  const needs = await prisma.transportAccessNeed.findUnique({
    where: { requestId },
  });
  if (!needs) return;

  await prisma.transportAccessNeed.upsert({
    where: { tripId },
    create: {
      tripId,
      wheelchairRequired: needs.wheelchairRequired,
      assistedPickup: needs.assistedPickup,
      assistedDropoff: needs.assistedDropoff,
      driverAssistanceRequired: needs.driverAssistanceRequired,
      mobilityAidsJson: needs.mobilityAidsJson ?? undefined,
      assistanceNotes: needs.assistanceNotes,
      shareAccessibility: needs.shareAccessibility,
    },
    update: {},
  });
}

export { recordTransportTripEvent };
