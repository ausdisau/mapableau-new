import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { phase5Config } from "@/lib/config/phase5";
import { prisma } from "@/lib/prisma";
import { geocodeAddress } from "@/lib/transport-osm/location-service";
import { getRoutingProvider } from "@/lib/transport-osm/routing";

export async function planFromTransportBooking(
  transportBookingId: string,
  actorUserId: string
) {
  if (!phase5Config.routeOptimisationEnabled) {
    return { skipped: true, message: "Route optimisation disabled" };
  }

  const tb = await prisma.transportBooking.findUnique({
    where: { id: transportBookingId },
  });
  if (!tb) throw new Error("NOT_FOUND");

  let pickupLat = tb.pickupLat;
  let pickupLng = tb.pickupLng;
  let dropoffLat = tb.dropoffLat;
  let dropoffLng = tb.dropoffLng;

  if (pickupLat == null || pickupLng == null) {
    const g = await geocodeAddress(tb.pickupAddress);
    pickupLat = g.lat;
    pickupLng = g.lng;
  }
  if (dropoffLat == null || dropoffLng == null) {
    const g = await geocodeAddress(tb.dropoffAddress);
    dropoffLat = g.lat;
    dropoffLng = g.lng;
  }

  const provider = getRoutingProvider();
  const route = await provider.route({
    coordinates: [
      { lat: pickupLat, lng: pickupLng },
      { lat: dropoffLat, lng: dropoffLng },
    ],
  });

  const plan = await prisma.routePlan.create({
    data: {
      transportBookingId,
      status: "review_required",
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
        })),
      },
    },
  });

  await prisma.routeStop.createMany({
    data: [
      { routePlanId: plan.id, sequence: 1, label: "Pickup", address: tb.pickupAddress },
      { routePlanId: plan.id, sequence: 2, label: "Drop-off", address: tb.dropoffAddress },
    ],
  });

  const reqs = (tb.vehicleRequirements as Record<string, boolean>) ?? {};
  if (reqs.requiresWheelchairAccessible) {
    await prisma.routeConstraint.create({
      data: {
        routePlanId: plan.id,
        type: "wheelchair_accessible_vehicle_required",
        description: "Wheelchair accessible vehicle required",
      },
    });
  }

  await prisma.routePlanCandidate.create({
    data: {
      routePlanId: plan.id,
      summary: `Recommended route — ${Math.ceil(route.durationSeconds / 60)} min, ${(route.distanceMeters / 1000).toFixed(1)} km`,
      riskNotes: "Verify boarding time is sufficient for access needs",
      score: 1,
    },
  });

  await prisma.travelTimeEstimate.create({
    data: {
      routePlanId: plan.id,
      minutes: Math.ceil(route.durationSeconds / 60),
      source: provider.name,
    },
  });

  await createAuditEvent({
    actorUserId,
    action: "route.plan_generated",
    entityType: "RoutePlan",
    entityId: plan.id,
  });

  return plan;
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

  await createAuditEvent({
    actorUserId,
    action: "route.plan_selected",
    entityType: "RoutePlan",
    entityId: routePlanId,
    metadata: { candidateId },
  });

  return plan;
}
