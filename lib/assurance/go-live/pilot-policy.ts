import type { PilotStatus } from "@prisma/client";

/** Wave 6/7: software never auto-activates a ControlledPilot. */
export function canAutoActivatePilot(_status: PilotStatus): false {
  void _status;
  return false;
}

/**
 * Approval after go-live assessment records intent only.
 * Wave 7 progression uses PilotDecisionRecord — this helper must not activate.
 */
export function nextPilotStatusAfterApproval(current: PilotStatus): PilotStatus {
  switch (current) {
    case "draft":
    case "pending_decision":
      return "approved";
    case "approved":
    case "active":
    case "paused":
    case "draining":
    case "terminated":
    case "closed":
      return current;
    default: {
      const _exhaustive: never = current;
      return _exhaustive;
    }
  }
}

export function assertPilotNotAutoActivated(pilot: {
  limitedLiveEnabled: boolean;
  status: PilotStatus;
  activatedAt: Date | null;
}): void {
  if (pilot.limitedLiveEnabled && pilot.status === "draft") {
    throw new Error("PILOT_LIMITED_LIVE_MUST_NOT_ENABLE_ON_DRAFT");
  }
  if (pilot.status === "active" && !pilot.activatedAt) {
    throw new Error("PILOT_ACTIVE_WITHOUT_ACTIVATION_TIMESTAMP");
  }
  if (canAutoActivatePilot(pilot.status)) {
    throw new Error("PILOT_AUTO_ACTIVATE_FORBIDDEN");
  }
}
