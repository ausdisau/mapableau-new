import { prisma } from "@/lib/prisma";
import { getVehicleSuitabilityWarnings } from "@/lib/transport/vehicle-suitability";

export async function getServiceOpsSummary() {
  const [
    careAwaitingReview,
    shiftsAwaitingWorker,
    transportAwaitingOperator,
    transportVehicleIssues,
    jobsAwaitingPublish,
    applicationsWithAdjustments,
    shiftsAwaitingApproval,
    draftInvoiceLines,
  ] = await Promise.all([
    prisma.careRequest.count({
      where: { status: { in: ["submitted", "awaiting_admin_review"] } },
    }),
    prisma.careShift.count({
      where: { status: "scheduled", workerProfileId: null },
    }),
    prisma.transportBooking.count({
      where: { status: "quote_requested" },
    }),
    prisma.transportBooking.count({
      where: {
        status: { in: ["provider_accepted", "vehicle_dispatched", "driver_assigned"] },
        vehicleId: null,
      },
    }),
    prisma.job.count({ where: { status: "draft" } }),
    prisma.jobApplication.count({
      where: {
        reasonableAdjustmentRequest: { not: null },
        shareAdjustments: false,
        status: "submitted",
      },
    }),
    prisma.careShift.count({
      where: { status: "awaiting_participant_approval" },
    }),
    prisma.invoice.count({ where: { status: "draft" } }),
  ]);

  return {
    careAwaitingReview,
    shiftsAwaitingWorker,
    transportAwaitingOperator,
    transportVehicleIssues,
    jobsAwaitingPublish,
    applicationsWithAdjustments,
    shiftsAwaitingApproval,
    draftInvoiceLines,
  };
}

export async function getAtRiskItems() {
  const items: { type: string; id: string; reason: string }[] = [];

  const transports = await prisma.transportBooking.findMany({
    where: { vehicleId: { not: null }, status: { notIn: ["completed", "cancelled"] } },
    include: { vehicle: true },
    take: 20,
  });

  for (const t of transports) {
    const reqs = (t.vehicleRequirements ?? {}) as Record<string, boolean>;
    const warnings = getVehicleSuitabilityWarnings(
      {
        requiresWheelchairAccessible: reqs.requiresWheelchairAccessible,
        requiresRamp: reqs.requiresRamp,
      },
      t.vehicle
    );
    if (warnings.some((w) => w.includes("not"))) {
      items.push({
        type: "transport",
        id: t.id,
        reason: warnings.join(" "),
      });
    }
  }

  const linked = await prisma.careRequest.findMany({
    where: {
      linkedTransportRequired: true,
      status: { in: ["submitted", "confirmed"] },
    },
    take: 10,
  });
  for (const c of linked) {
    const tb = await prisma.transportBooking.findFirst({
      where: { careRequestId: c.id },
    });
    if (!tb) {
      items.push({
        type: "care",
        id: c.id,
        reason: "Linked transport required but no transport booking created yet.",
      });
    }
  }

  return items;
}
