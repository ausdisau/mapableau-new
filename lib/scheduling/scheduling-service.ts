import type { BookingType } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { createBooking } from "@/lib/bookings/booking-service";
import { schedulingConfig } from "@/lib/config/scheduling";
import { findOrganisationsWithinRadiusMeters } from "@/lib/geo/postgis";
import { resolveParticipantLocationCoords } from "@/lib/locations/participant-location-service";
import { prisma } from "@/lib/prisma";
import { assertNoDoubleBooking } from "@/lib/scheduling/conflict-detector";
import { HeuristicSchedulingEngine } from "@/lib/scheduling/heuristic-scheduling-engine";
import { ortoolsSchedulingEngine } from "@/lib/scheduling/ortools-scheduling-engine";
import { timefoldSchedulingEngine } from "@/lib/scheduling/timefold-scheduling-engine";
import type { SchedulingEngine } from "@/lib/scheduling/scheduling-engine";
import type { SchedulingRequest } from "@/types/scheduling";
import {
  runCareWorkerMatch,
  runTransportVehicleMatch,
} from "@/lib/matching/matching-service";
import { planFromTransportBooking } from "@/lib/route-optimisation/route-plan-service";

function getEngine(): SchedulingEngine {
  switch (schedulingConfig.schedulingEngine) {
    case "ortools":
      return ortoolsSchedulingEngine;
    case "timefold":
      return timefoldSchedulingEngine;
    default:
      return new HeuristicSchedulingEngine();
  }
}

function toBookingType(serviceType: SchedulingRequest["serviceType"]): BookingType {
  if (serviceType === "care") return "care";
  if (serviceType === "transport") return "transport";
  return "care_transport";
}

export async function createSchedulingRequest(params: {
  request: SchedulingRequest;
  participantId: string;
  actorUserId: string;
}) {
  const { request, participantId, actorUserId } = params;
  const requestedStart = new Date(request.requestedStart);
  const requestedEnd = request.requestedEnd
    ? new Date(request.requestedEnd)
    : new Date(requestedStart.getTime() + 2 * 60 * 60_000);

  let pickupCoords: { lat: number; lng: number } | undefined;
  let dropoffCoords: { lat: number; lng: number } | undefined;

  if (request.pickupLocationId) {
    pickupCoords = await resolveParticipantLocationCoords(request.pickupLocationId);
  }
  if (request.dropoffLocationId) {
    dropoffCoords = await resolveParticipantLocationCoords(request.dropoffLocationId);
  }

  let organisationId = request.organisationId;
  if (!organisationId && pickupCoords) {
    const nearby = await findOrganisationsWithinRadiusMeters({
      lat: pickupCoords.lat,
      lng: pickupCoords.lng,
      radiusMeters: 50_000,
      limit: 1,
    });
    organisationId = nearby[0]?.organisationId;
  }

  const booking = await createBooking({
    participantId,
    createdById: actorUserId,
    bookingType: toBookingType(request.serviceType),
    requestedStart: requestedStart.toISOString(),
    requestedEnd: requestedEnd.toISOString(),
    assignedOrganisationId: organisationId,
    title: request.title,
    participantNotes: request.participantNotes,
    accessibilityRequirements: request.accessibilityRequirements,
    pickupAddress: pickupCoords ? "Private location" : undefined,
    dropoffAddress: dropoffCoords ? "Private location" : undefined,
    shareAccessibility: false,
  });

  let careRequestId: string | undefined;
  let transportBookingId: string | undefined;

  if (request.serviceType === "care" || request.serviceType === "care_transport") {
    const careRequest = await prisma.careRequest.create({
      data: {
        participantId,
        createdById: actorUserId,
        bookingId: booking.id,
        assignedOrganisationId: organisationId,
        requestType: "community_access",
        title: request.title ?? "Care support request",
        description:
          request.participantNotes ?? "Scheduled via MapAble scheduling.",
        preferredDate: requestedStart,
        status: "submitted",
      },
    });
    careRequestId = careRequest.id;
    await runCareWorkerMatch(careRequest.id, actorUserId).catch(() => undefined);
  }

  if (request.serviceType === "transport" || request.serviceType === "care_transport") {
    if (!pickupCoords || !dropoffCoords) {
      throw new Error("TRANSPORT_LOCATIONS_REQUIRED");
    }
    const transport = await prisma.transportBooking.create({
      data: {
        bookingId: booking.id,
        participantId,
        transportType: "one_way",
        pickupAddress: "Private location",
        pickupLat: pickupCoords.lat,
        pickupLng: pickupCoords.lng,
        pickupParticipantLocationId: request.pickupLocationId,
        dropoffAddress: "Private location",
        dropoffLat: dropoffCoords.lat,
        dropoffLng: dropoffCoords.lng,
        dropoffParticipantLocationId: request.dropoffLocationId,
        pickupWindowStart: requestedStart,
        pickupWindowEnd: requestedEnd,
        operatorOrganisationId: organisationId,
        careRequestId,
        status: "requested",
      },
    });
    transportBookingId = transport.id;
    await runTransportVehicleMatch(transport.id, actorUserId).catch(
      () => undefined
    );
    await planFromTransportBooking(transport.id, actorUserId).catch(() => undefined);
  }

  await createAuditEvent({
    actorUserId,
    action: "scheduling.request_created",
    entityType: "Booking",
    entityId: booking.id,
    participantId,
    organisationId: organisationId ?? undefined,
    metadata: { serviceType: request.serviceType },
  });

  return { booking, careRequestId, transportBookingId };
}

export async function persistSchedulingProposal(params: {
  bookingId: string;
  organisationId: string;
  actorUserId: string;
  proposal: Awaited<ReturnType<SchedulingEngine["proposeAssignments"]>>;
  careShiftId?: string;
  transportBookingId?: string;
}) {
  const run = await prisma.schedulingRun.create({
    data: {
      organisationId: params.organisationId,
      bookingId: params.bookingId,
      engine: params.proposal.engine,
      inputSnapshot: { bookingId: params.bookingId },
      outputSnapshot: params.proposal,
      score: params.proposal.score,
      createdById: params.actorUserId,
    },
  });

  for (const a of params.proposal.assignments) {
    await assertNoDoubleBooking({
      resourceType: a.resourceType,
      resourceId: a.resourceId,
      startsAt: a.startsAt,
      endsAt: a.endsAt,
    });
    await prisma.scheduledAssignment.create({
      data: {
        resourceType: a.resourceType,
        resourceId: a.resourceId,
        startsAt: a.startsAt,
        endsAt: a.endsAt,
        bookingId: params.bookingId,
        careShiftId: params.careShiftId,
        transportBookingId: params.transportBookingId,
        organisationId: params.organisationId,
        notes: a.explanation,
      },
    });
  }

  return run;
}

export async function proposeScheduleForBooking(
  bookingId: string,
  organisationId: string,
  actorUserId: string
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { transportBooking: true, careShifts: true },
  });
  if (!booking) throw new Error("NOT_FOUND");

  const workers = await prisma.workerProfile.findMany({
    where: { organisationId, active: true },
    take: 10,
  });
  const sites = await prisma.serviceSite.findMany({
    where: { organisationId, active: true },
    take: 1,
  });
  const site = sites[0];

  const engine = getEngine();
  const proposal = await engine.proposeAssignments({
    bookingId,
    organisationId,
    windows: [
      {
        start: booking.requestedStart,
        end: booking.requestedEnd ?? new Date(booking.requestedStart.getTime() + 7200000),
      },
    ],
    resources: workers.map((w) => ({
      type: "worker" as const,
      id: w.id,
      siteLat: site?.lat,
      siteLng: site?.lng,
    })),
    pickup:
      booking.transportBooking?.pickupLat != null &&
      booking.transportBooking.pickupLng != null
        ? {
            lat: booking.transportBooking.pickupLat,
            lng: booking.transportBooking.pickupLng,
          }
        : undefined,
  });

  await persistSchedulingProposal({
    bookingId,
    organisationId,
    actorUserId,
    proposal,
    careShiftId: booking.careShifts[0]?.id,
    transportBookingId: booking.transportBooking?.id,
  });

  return proposal;
}
