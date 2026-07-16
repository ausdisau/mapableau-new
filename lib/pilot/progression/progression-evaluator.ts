import type { PilotStage, PilotStatus } from "@prisma/client";

import { capturePilotEvidenceSnapshot } from "@/lib/pilot/progression/pilot-evidence-snapshot";
import { isLimitedLivePermitted } from "@/lib/pilot/policy/stage-policy";

export type ProgressionEvaluation = {
  canAdvance: boolean;
  blockers: string[];
  recommendedNextStage: PilotStage | null;
  evidence: Awaited<ReturnType<typeof capturePilotEvidenceSnapshot>>;
};

const NEXT: Partial<Record<PilotStage, PilotStage>> = {
  design: "readiness",
  readiness: "sandbox",
  sandbox: "dry_run",
  dry_run: "shadow",
  shadow: "limited_live",
  limited_live: "controlled_live",
  controlled_live: "wind_down",
  wind_down: "closed",
};

/**
 * Human decision support only — never auto-advances or auto-approves.
 */
export async function evaluatePilotProgression(input: {
  pilotId: string;
  status: PilotStatus;
  stage: PilotStage;
  limitedLiveEnabled: boolean;
  assuranceAssessmentId: string | null;
  goLiveAssessmentId: string | null;
}): Promise<ProgressionEvaluation> {
  const evidence = await capturePilotEvidenceSnapshot(input.pilotId);
  const blockers: string[] = [];

  if (input.status !== "active" && input.status !== "approved") {
    blockers.push(`STATUS_NOT_ADVANCEABLE:${input.status}`);
  }
  if (evidence.openSignals > 0) {
    blockers.push("UNACKNOWLEDGED_SAFETY_SIGNALS");
  }
  if (evidence.openCorrectiveActions > 0) {
    blockers.push("OPEN_CORRECTIVE_ACTIONS");
  }

  const recommendedNextStage = NEXT[input.stage] ?? null;
  if (recommendedNextStage) {
    const liveCheck = isLimitedLivePermitted({
      stage: recommendedNextStage,
      limitedLiveEnabled: input.limitedLiveEnabled,
      assuranceAssessmentId: input.assuranceAssessmentId,
      goLiveAssessmentId: input.goLiveAssessmentId,
    });
    if (!liveCheck.ok) {
      blockers.push(...liveCheck.reasons);
    }
  }

  return {
    canAdvance: blockers.length === 0 && recommendedNextStage !== null,
    blockers,
    recommendedNextStage,
    evidence,
  };
}
