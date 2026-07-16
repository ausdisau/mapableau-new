import type { PilotStage } from "@prisma/client";

import {
  isLimitedLivePermitted,
  requiresAssuranceForStage,
} from "@/lib/pilot/policy/stage-policy";

export const PILOT_STAGE_ORDER: readonly PilotStage[] = [
  "design",
  "readiness",
  "sandbox",
  "dry_run",
  "shadow",
  "limited_live",
  "controlled_live",
  "wind_down",
  "closed",
] as const;

export function stageIndex(stage: PilotStage): number {
  return PILOT_STAGE_ORDER.indexOf(stage);
}

export function canAdvanceStage(from: PilotStage, to: PilotStage): boolean {
  if (from === to) return false;
  if (to === "closed" || to === "wind_down") return true;
  const fi = stageIndex(from);
  const ti = stageIndex(to);
  if (fi < 0 || ti < 0) return false;
  // Allow advance by one step, or retreat for safety.
  return ti === fi + 1 || ti < fi;
}

export function assertCanAdvanceStage(
  from: PilotStage,
  to: PilotStage,
  pilot: {
    limitedLiveEnabled: boolean;
    assuranceAssessmentId: string | null;
    goLiveAssessmentId: string | null;
  }
): void {
  if (!canAdvanceStage(from, to)) {
    throw new Error(`PILOT_STAGE_TRANSITION_DENIED:${from}->${to}`);
  }
  if (requiresAssuranceForStage(to)) {
    const check = isLimitedLivePermitted({
      stage: to,
      limitedLiveEnabled: pilot.limitedLiveEnabled,
      assuranceAssessmentId: pilot.assuranceAssessmentId,
      goLiveAssessmentId: pilot.goLiveAssessmentId,
    });
    if (!check.ok) {
      throw new Error(`PILOT_STAGE_BLOCKED:${check.reasons.join(",")}`);
    }
  }
}
