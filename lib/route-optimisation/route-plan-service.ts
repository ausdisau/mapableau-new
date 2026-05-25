import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { isDynamicRoutingEnabled } from "@/lib/config/dynamic-routing";
import { phase5Config } from "@/lib/config/phase5";
import { prisma } from "@/lib/prisma";
import { computeDynamicRouteEstimate } from "@/lib/routing/dynamic-route-service";

export async function planFromTransportBooking(
  transportBookingId: string,
  actorUserId: string,
) {
  if (!phase5Config.routeOptimisationEnabled && !isDynamicRoutingEnabled()) {
    return { skipped: true, message: "Route planning disabled" };
  }

  const tb = await prisma.transportBooking.findUnique({
    where: { id: transportBookingId },
  });
  if (!tb) throw new Error("NOT_FOUND");

  const estimate = isDynamicRoutingEnabled()
    ? await computeDynamicRouteEstimate(transportBookingId)
    : null;

  const plan = await prisma.routePlan.create({
    data: {
      transportBookingId,
      status: "review_required",
      createdById: actorUserId,
    },
  });

  await prisma.routeStop.createMany({
    data: [
      {
        routePlanId: plan.id,
        sequence: 1,
        label: "Pickup",
        address: tb.pickupAddress,
      },
      {
        routePlanId: plan.id,
        sequence: 2,
        label: "Drop-off",
        address: tb.dropoffAddress,
      },
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

  const baseMinutes = estimate?.durationMinutes ?? 30;
  const estimates = [
    baseMinutes,
    Math.round(baseMinutes * 1.15),
    Math.round(baseMinutes * 1.3),
  ];
  const distanceLabel = estimate
    ? `${estimate.distanceKm.toFixed(1)} km (${estimate.source})`
    : "distance unknown";

  for (let i = 0; i < estimates.length; i++) {
    await prisma.routePlanCandidate.create({
      data: {
        routePlanId: plan.id,
        summary: `Route option ${i + 1} — ~${estimates[i]} min, ${distanceLabel}`,
        riskNotes:
          i === 0
            ? "Shortest time — verify boarding time is sufficient"
            : "Alternative timing",
        score: 1 - i * 0.1,
      },
    });
    await prisma.travelTimeEstimate.create({
      data: {
        routePlanId: plan.id,
        minutes: estimates[i],
        source:
          estimate && phase5Config.routeProvider !== "disabled"
            ? phase5Config.routeProvider
            : estimate
              ? "haversine"
              : "placeholder",
      },
    });
  }

  await createAuditEvent({
    actorUserId,
    action: "route.plan_generated",
    entityType: "RoutePlan",
    entityId: plan.id,
  });

  return { plan, estimate };
}

export async function selectRoutePlan(
  routePlanId: string,
  candidateId: string,
  actorUserId: string,
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
