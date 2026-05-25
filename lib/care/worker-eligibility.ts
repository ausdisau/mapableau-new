import { prisma } from "@/lib/prisma";

export function hasHighIntensityTask(tasks: unknown): boolean {
  if (!Array.isArray(tasks)) return false;
  return tasks.some((task) => {
    if (!task || typeof task !== "object") return false;
    const intensity = "intensity" in task ? String(task.intensity) : "";
    return intensity.toLowerCase().includes("high");
  });
}

export async function assertWorkerEligibleForBooking(params: {
  bookingId: string;
  workerProfileId: string;
}) {
  const [booking, worker] = await Promise.all([
    prisma.careBooking.findUnique({
      where: { id: params.bookingId },
      include: { accessNeeds: true },
    }),
    prisma.workerProfile.findUnique({ where: { id: params.workerProfileId } }),
  ]);

  if (!booking) throw new Error("BOOKING_NOT_FOUND");
  if (!worker) throw new Error("WORKER_NOT_FOUND");
  if (!worker.active) throw new Error("WORKER_INACTIVE");
  if (worker.organisationId !== booking.organisationId) {
    throw new Error("WORKER_ORG_MISMATCH");
  }
  if (worker.workerScreeningStatus !== "verified") {
    throw new Error("WORKER_SCREENING_REQUIRED");
  }
  if (hasHighIntensityTask(booking.tasks) && !worker.highIntensityCompetencyVerified) {
    throw new Error("HIGH_INTENSITY_COMPETENCY_REQUIRED");
  }

  return { booking, worker };
}
import { prisma } from "@/lib/prisma";

type TaskLike = { intensity?: unknown };

export function hasHighIntensityTask(tasks: unknown): boolean {
  if (!Array.isArray(tasks)) return false;
  return tasks.some(
    (task): task is TaskLike =>
      typeof task === "object" &&
      task !== null &&
      "intensity" in task &&
      (task as TaskLike).intensity === "high"
  );
}

export async function assertWorkerEligibleForBooking(params: {
  bookingId: string;
  workerProfileId: string;
}) {
  const booking = await prisma.careBooking.findUnique({
    where: { id: params.bookingId },
    include: { accessNeeds: true },
  });
  if (!booking) throw new Error("BOOKING_NOT_FOUND");

  const worker = await prisma.workerProfile.findUnique({
    where: { id: params.workerProfileId },
  });
  if (!worker) throw new Error("WORKER_NOT_FOUND");
  if (!worker.active) throw new Error("WORKER_INACTIVE");
  if (worker.organisationId !== booking.organisationId) {
    throw new Error("WORKER_ORG_MISMATCH");
  }
  if (
    worker.workerScreeningStatus !== "verified" ||
    worker.verificationStatus !== "verified"
  ) {
    throw new Error("WORKER_SCREENING_REQUIRED");
  }

  const highIntensity =
    hasHighIntensityTask(booking.tasks) ||
    booking.accessNeeds.some((need) => need.intensity === "high");
  if (highIntensity && !worker.highIntensityCompetencyVerified) {
    throw new Error("HIGH_INTENSITY_COMPETENCY_REQUIRED");
  }

  return { booking, worker };
}
