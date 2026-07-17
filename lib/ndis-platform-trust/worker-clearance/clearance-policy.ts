import type { WorkerClearanceStatus } from "@prisma/client";

export function clearanceSupportsEligibility(
  status: WorkerClearanceStatus
): boolean {
  return status === "verified";
}

export function pendingClearanceIsEligible(
  status: WorkerClearanceStatus
): false {
  void status;
  return false;
}
