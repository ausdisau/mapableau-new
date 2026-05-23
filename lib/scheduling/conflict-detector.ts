import type { ScheduledResourceType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function assertNoDoubleBooking(params: {
  resourceType: ScheduledResourceType;
  resourceId: string;
  startsAt: Date;
  endsAt: Date;
  excludeAssignmentId?: string;
}) {
  const overlap = await prisma.scheduledAssignment.findFirst({
    where: {
      id: params.excludeAssignmentId ? { not: params.excludeAssignmentId } : undefined,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      startsAt: { lt: params.endsAt },
      endsAt: { gt: params.startsAt },
    },
  });
  if (overlap) {
    throw new Error("DOUBLE_BOOKING_CONFLICT");
  }

  if (params.resourceType === "worker") {
    const shift = await prisma.careShift.findFirst({
      where: {
        workerProfileId: params.resourceId,
        startAt: { lt: params.endsAt },
        endAt: { gt: params.startsAt },
        status: { notIn: ["cancelled"] },
      },
    });
    if (shift) throw new Error("CARE_SHIFT_CONFLICT");
  }

  if (params.resourceType === "driver") {
    const transport = await prisma.transportBooking.findFirst({
      where: {
        driverProfileId: params.resourceId,
        pickupWindowStart: { lt: params.endsAt },
        status: { notIn: ["cancelled", "draft"] },
      },
    });
    if (transport) throw new Error("TRANSPORT_CONFLICT");
  }
}

export async function findConflictsForResource(
  resourceType: ScheduledResourceType,
  resourceId: string,
  from: Date,
  to: Date
) {
  return prisma.scheduledAssignment.findMany({
    where: {
      resourceType,
      resourceId,
      startsAt: { lt: to },
      endsAt: { gt: from },
    },
    orderBy: { startsAt: "asc" },
  });
}
