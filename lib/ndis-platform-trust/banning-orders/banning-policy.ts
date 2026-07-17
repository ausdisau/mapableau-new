import type { WorkerBanningAssessmentStatus } from "@prisma/client";

/** source_unavailable must never be treated as clear. */
export function banningStatusIsClear(
  status: WorkerBanningAssessmentStatus
): boolean {
  return status === "clear";
}

export function sourceUnavailableMeansClear(
  status: WorkerBanningAssessmentStatus
): false {
  void status;
  return false;
}
