import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { phase5Config } from "@/lib/config/phase5";
import { schedulingConfig } from "@/lib/config/scheduling";
import { prisma } from "@/lib/prisma";
import {
  computeRoute,
  persistRoutePlanGeometry,
} from "@/lib/routing/routing-service";
import { resolveParticipantLocationCoords } from "@/lib/locations/participant-location-service";
import type { RoutingStopRef } from "@/types/routing";

async function resolveTransportStops(transportBookingId: string) {
  const tb = await prisma.transportBooking.findUnique({
    where: { id: transportBookingId },
  });
  if (!tb) throw new Error("NOT_FOUND");

  const stops: RoutingStopRef[] = [];
  if (tb.pickupParticipantLocationId) {
    stops.push({
      type: "participant_location",
      id: tb.pickupParticipantLocationId,
    });
  } else if (tb.pickupLat != null && tb.pickupLng != null) {
    stops.push({ type: "coordinate", lat: tb.pickupLat, lng: tb.pickupLng });
  }

  if (tb.dropoffParticipantLocationId) {
    stops.push({
      type: "participant_location",
      id: tb.dropoffParticipantLocationId,
    });
  } else if (tb.dropoffLat != null && tb.dropoffLng != null) {
    stops.push({ type: "coordinate", lat: tb.dropoffLat, lng: tb.dropoffLng });
  }

  return { tb, stops };
}

export async function planFromTransportBooking(
  transportBookingId: string,
  actorUserId: string
) {
  if (!phase5Config.routeOptimisationEnabled && !schedulingConfig.schedulingEnabled) {
    return { skipped: true, message: "Route optimisation disabled" };
  }

  const { tb, stops } = await resolveTransportStops(transportBookingId);
  if (stops.length < 2) {
    if (tb.pickupParticipantLocationId) {
      const p = await resolveParticipantLocationCoords(tb.pickupParticipantLocationId);
      stops.push({ type: "coordinate", lat: p.lat, lng: p.lng });
    }
    if (tb.dropoffParticipantLocationId) {
      const d = await resolveParticipantLocationCoords(
        tb.dropoffParticipantLocationId
      );
      stops.push({ type: "coordinate", lat: d.lat, lng: d.lng });
    }
  }
  if (stops.length < 2) {
    throw new Error("INSUFFICIENT_COORDINATES");
  }

  const plan = await prisma.routePlan.create({
    data: {
      transportBookingId,
      status: "review_required",
      createdById: actorUserId,
    },
  });

  const createdStops = [];
  for (let i = 0; i < stops.length; i++) {
    const ref = stops[i];
    let lat: number | undefined;
    let lng: number | undefined;
    let participantLocationId: string | undefined;
    let serviceSiteId: string | undefined;
    let label = i === 0 ? "Pickup" : "Drop-off";

    if (ref.type === "coordinate") {
      lat = ref.lat;
      lng = ref.lng;
    } else if (ref.type === "participant_location") {
      participantLocationId = ref.id;
      const coords = await resolveParticipantLocationCoords(ref.id);
      lat = coords.lat;
      lng = coords.lng;
      label = coords.label;
    } else {
      serviceSiteId = ref.id;
      const site = await prisma.serviceSite.findUnique({ where: { id: ref.id } });
      lat = site?.lat;
      lng = site?.lng;
      label = site?.name ?? label;
    }

    const stop = await prisma.routeStop.create({
      data: {
        routePlanId: plan.id,
        sequence: i + 1,
        label,
        lat,
        lng,
        participantLocationId,
        serviceSiteId,
      },
    });
    createdStops.push(stop);
  }

  const reqs = (tb.vehicleRequirements as Record<string, boolean>) ?? {};
  const constraints = [];
  if (reqs.requiresWheelchairAccessible) {
    constraints.push({
      type: "wheelchair_accessible_vehicle_required" as const,
      description: "Wheelchair accessible vehicle required",
    });
  }

  for (const c of constraints) {
    await prisma.routeConstraint.create({
      data: {
        routePlanId: plan.id,
        type: c.type,
        description: c.description,
      },
    });
  }

  const routeResult = await computeRoute(
    stops,
    constraints.map((c) => ({ type: c.type }))
  );

  await persistRoutePlanGeometry(
    plan.id,
    routeResult,
    createdStops.map((s) => s.id)
  );

  await prisma.routePlanCandidate.create({
    data: {
      routePlanId: plan.id,
      summary: `Recommended route — ${Math.ceil(routeResult.totalDurationSeconds / 60)} min, ${(routeResult.totalDistanceMeters / 1000).toFixed(1)} km`,
      riskNotes: "Verify boarding buffers for accessibility needs.",
      score: 1,
    },
  });

  await prisma.routePlan.update({
    where: { id: plan.id },
    data: { status: "generated" },
  });

  await createAuditEvent({
    actorUserId,
    action: "route.plan_generated",
    entityType: "RoutePlan",
    entityId: plan.id,
    metadata: { source: routeResult.source, stopCount: stops.length },
  });

  return prisma.routePlan.findUnique({
    where: { id: plan.id },
    include: { stops: true, constraints: true, candidates: true },
  });
}

export async function selectRoutePlan(
  routePlanId: string,
  candidateId: string,
  actorUserId: string
) {
  const candidate = await prisma.routePlanCandidate.findUnique({
    where: { id: candidateId },
  });
  if (!candidate) throw new Error("NOT_FOUND");

  await prisma.routePlan.update({
    where: { id: routePlanId },
    data: { status: "selected" },
  });

  await prisma.routePlanDecision.create({
    data: {
      routePlanId,
      decidedById: actorUserId,
      outcome: "selected",
    },
  });

  const plan = await prisma.routePlan.findUnique({
    where: { id: routePlanId },
  });
  if (plan?.transportBookingId) {
    await prisma.transportBooking.update({
      where: { id: plan.transportBookingId },
      data: { pickupNotes: `Route plan selected: ${candidate.summary}` },
    });
  }

  await createAuditEvent({
    actorUserId,
    action: "route.plan_selected",
    entityType: "RoutePlan",
    entityId: routePlanId,
  });

  return plan;
}
