import type { WorkerProfile } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type CareTaskInput = {
  name?: string;
  intensity?: "standard" | "high";
  [key: string]: unknown;
};

export function bookingHasHighIntensityTasks(tasks: unknown): boolean {
  if (!Array.isArray(tasks)) return false;
  return (tasks as CareTaskInput[]).some((t) => t.intensity === "high");
}

export function assertWorkerEligibleForBooking(
  worker: Pick<
    WorkerProfile,
    | "id"
    | "organisationId"
    | "active"
    | "verificationStatus"
    | "workerScreeningStatus"
    | "highIntensityCompetencyVerified"
  >,
  params: {
    organisationId: string;
    tasks: unknown;
  }
): void {
  if (!worker.active) {
    throw new Error("WORKER_INACTIVE");
  }
  if (worker.organisationId !== params.organisationId) {
    throw new Error("WORKER_ORG_MISMATCH");
  }
  if (worker.verificationStatus !== "verified") {
    throw new Error("WORKER_NOT_VERIFIED");
  }
  if (worker.workerScreeningStatus !== "verified") {
    throw new Error("WORKER_SCREENING_REQUIRED");
  }
  if (
    bookingHasHighIntensityTasks(params.tasks) &&
    !worker.highIntensityCompetencyVerified
  ) {
    throw new Error("HIGH_INTENSITY_COMPETENCY_REQUIRED");
  }
}

export async function loadWorkerForEligibility(workerProfileId: string) {
  const worker = await prisma.workerProfile.findUnique({
    where: { id: workerProfileId },
  });
  if (!worker) throw new Error("WORKER_NOT_FOUND");
  return worker;
}
