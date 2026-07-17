import type { PilotStage, PilotStatus } from "@prisma/client";

export function canApplyPilotChange(input: {
  status: PilotStatus;
  stage: PilotStage;
  changeApproved: boolean;
}): { ok: boolean; reason?: string } {
  if (!input.changeApproved) return { ok: false, reason: "CHANGE_NOT_APPROVED" };
  if (input.status === "paused") return { ok: false, reason: "PILOT_PAUSED" };
  if (input.status === "closed" || input.status === "terminated") {
    return { ok: false, reason: "PILOT_TERMINAL" };
  }
  if (input.stage === "limited_live" || input.stage === "controlled_live") {
    return { ok: true, reason: "CANARY_REQUIRED" };
  }
  return { ok: true };
}
