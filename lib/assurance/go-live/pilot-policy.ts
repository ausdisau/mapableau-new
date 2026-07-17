import type { ControlledPilotStatus } from "@prisma/client";

export function canAutoActivatePilot(_status: ControlledPilotStatus): false {
  void _status;
  return false;
}

export function nextPilotStatusAfterApproval(
  current: ControlledPilotStatus
): ControlledPilotStatus {
  switch (current) {
    case "draft":
    case "pending_approval":
      return "approved_not_activated";
    case "approved_not_activated":
    case "active":
    case "paused":
    case "completed":
    case "aborted":
    case "retired":
      return current;
    default: {
      const _exhaustive: never = current;
      return _exhaustive;
    }
  }
}

export function assertPilotNotAutoActivated(pilot: {
  autoActivateForbidden: boolean;
  status: ControlledPilotStatus;
  activatedAt: Date | null;
}): void {
  if (!pilot.autoActivateForbidden) {
    throw new Error("PILOT_AUTO_ACTIVATE_MUST_REMAIN_FORBIDDEN_IN_WAVE_6");
  }
  if (pilot.status === "active" && !pilot.activatedAt) {
    throw new Error("PILOT_ACTIVE_WITHOUT_ACTIVATION_TIMESTAMP");
  }
}
