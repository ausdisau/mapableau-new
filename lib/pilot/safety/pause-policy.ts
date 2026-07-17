import type { PilotPauseReason, PilotStatus } from "@prisma/client";

export function canPausePilot(status: PilotStatus): boolean {
  return status === "active";
}

export function canResumePilot(status: PilotStatus): boolean {
  return status === "paused";
}

export function pauseBlocksNewOperations(status: PilotStatus): boolean {
  return status === "paused" || status === "draining" || status === "terminated" || status === "closed";
}

export function assertPauseReason(reason: PilotPauseReason | null | undefined): PilotPauseReason {
  if (!reason) throw new Error("PAUSE_REASON_REQUIRED");
  return reason;
}
