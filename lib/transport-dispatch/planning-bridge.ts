import { upsertQueue } from "@/lib/dispatch-console/dispatch-service";
import { phase5Config } from "@/lib/config/phase5";
import { phase6Config } from "@/lib/config/phase6";
import { prisma } from "@/lib/prisma";

/**
 * Upsert dispatch queue rows for transport planning/dispatch HITL.
 * Does not assign drivers or vehicles.
 */
export async function syncTransportPlanningQueues() {
  if (!phase6Config.dispatchConsoleEnabled) {
    return { skipped: true };
  }

  const synced: string[] = [];

  if (phase5Config.routeOptimisationEnabled) {
    const routePlans = await prisma.routePlan.findMany({
      where: { status: "review_required" },
      take: 20,
    });

    for (const plan of routePlans) {
      let organisationId: string | undefined;
      if (plan.transportBookingId) {
        const booking = await prisma.transportBooking.findUnique({
          where: { id: plan.transportBookingId },
          select: { operatorOrganisationId: true },
        });
        organisationId = booking?.operatorOrganisationId ?? undefined;
      }

      await upsertQueue({
        queueType: "transport_plan_review",
        title: `Route plan review`,
        entityType: "RoutePlan",
        entityId: plan.id,
        organisationId,
        priority: "high",
        plainLanguageSummary:
          "Transport route plan requires human review before dispatch",
      });
      synced.push(plan.id);
    }

    const optimisationJobs = await prisma.transportRouteOptimisationJob.findMany({
      where: { status: "completed", requiresHumanReview: true },
      take: 20,
    });

    for (const job of optimisationJobs) {
      await upsertQueue({
        queueType: "transport_optimisation_review",
        title: `Route optimisation ${job.id.slice(0, 8)}`,
        entityType: "TransportRouteOptimisationJob",
        entityId: job.id,
        organisationId: job.organisationId ?? undefined,
        priority: "normal",
        plainLanguageSummary:
          "Route optimisation suggestions require human review",
      });
      synced.push(job.id);
    }
  }

  const dispatchPendingTrips = await prisma.transportTrip.findMany({
    where: {
      status: "dispatch_pending",
      dispatchAssignments: { none: { active: true } },
    },
    take: 20,
  });

  for (const trip of dispatchPendingTrips) {
    await upsertQueue({
      queueType: "transport_dispatch",
      title: `Dispatch trip ${trip.id.slice(0, 8)}`,
      entityType: "TransportTrip",
      entityId: trip.id,
      organisationId: trip.providerOrganisationId,
      priority: "high",
      plainLanguageSummary:
        "Transport trip awaiting human driver/vehicle assignment",
    });
    synced.push(trip.id);
  }

  return { syncedCount: synced.length };
}

export async function enqueueTransportPlanReview(
  routePlanId: string,
  organisationId?: string
) {
  if (!phase6Config.dispatchConsoleEnabled) return;
  await upsertQueue({
    queueType: "transport_plan_review",
    title: "Route plan review",
    entityType: "RoutePlan",
    entityId: routePlanId,
    organisationId,
    priority: "high",
    plainLanguageSummary:
      "Transport route plan requires human review before dispatch",
  });
}
