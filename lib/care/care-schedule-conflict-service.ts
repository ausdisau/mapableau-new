import { prisma } from "@/lib/prisma";

export type CareScheduleConflict = {
  conflictType: string;
  details: string;
};

export type CareScheduleConflictResult = {
  hasConflict: boolean;
  conflicts: CareScheduleConflict[];
};

export async function detectCareScheduleConflicts(params: {
  workerProfileId: string;
  careBookingId?: string;
  scheduledStart: Date;
  scheduledEnd: Date;
}): Promise<CareScheduleConflictResult> {
  const conflicts: CareScheduleConflict[] = [];

  const overlappingShifts = await prisma.careShift.findMany({
    where: {
      workerProfileId: params.workerProfileId,
      careBookingId: params.careBookingId
        ? { not: params.careBookingId }
        : undefined,
      status: {
        notIn: ["cancelled", "disputed", "completed"],
      },
      startAt: { lt: params.scheduledEnd },
      endAt: { gt: params.scheduledStart },
    },
    take: 20,
  });

  for (const shift of overlappingShifts) {
    conflicts.push({
      conflictType: "shift_overlap",
      details: `Worker has care shift ${shift.id} at overlapping time`,
    });
  }

  const activeBookingWorkers = await prisma.careBookingWorker.findMany({
    where: {
      workerProfileId: params.workerProfileId,
      active: true,
      careBookingId: params.careBookingId
        ? { not: params.careBookingId }
        : undefined,
      careBooking: {
        status: {
          notIn: ["cancelled", "declined"],
        },
        scheduledStartAt: { lt: params.scheduledEnd },
        scheduledEndAt: { gt: params.scheduledStart },
      },
    },
    include: { careBooking: true },
    take: 20,
  });

  for (const bw of activeBookingWorkers) {
    conflicts.push({
      conflictType: "booking_overlap",
      details: `Worker assigned to booking ${bw.careBookingId} at overlapping time`,
    });
  }

  return { hasConflict: conflicts.length > 0, conflicts };
}
