import type { ControlledPilot } from "@prisma/client";

import {
  isFundingRouteAllowed,
  isSupportItemAllowed,
} from "@/lib/pilot/policy/allowlist";
import { isPilotOperationallyActive } from "@/lib/pilot/policy/pilot-status";
import {
  isLimitedLivePermitted,
  isOperationAllowedAtStage,
  type PilotOperation,
} from "@/lib/pilot/policy/stage-policy";

export type PolicyEvaluation = {
  allowed: boolean;
  reasons: string[];
};

export function evaluatePilotPolicy(input: {
  pilot: ControlledPilot;
  operation: PilotOperation;
  supportItemCode?: string;
  fundingRoute?: string;
}): PolicyEvaluation {
  const reasons: string[] = [];
  if (!isPilotOperationallyActive(input.pilot.status) && input.operation === "execute_transaction") {
    reasons.push(`STATUS_BLOCKS_OPS:${input.pilot.status}`);
  }
  if (input.pilot.status === "paused") {
    reasons.push("PILOT_PAUSED");
  }
  if (!isOperationAllowedAtStage(input.pilot.stage, input.operation)) {
    reasons.push(`STAGE_DENIES:${input.operation}`);
  }
  if (input.supportItemCode !== undefined) {
    if (!isSupportItemAllowed(input.pilot.supportItemAllowlist, input.supportItemCode)) {
      reasons.push("SUPPORT_ITEM_DENIED");
    }
  }
  if (input.fundingRoute !== undefined) {
    if (!isFundingRouteAllowed(input.pilot.fundingRouteAllowlist, input.fundingRoute)) {
      reasons.push("FUNDING_ROUTE_DENIED");
    }
  }
  const live = isLimitedLivePermitted({
    stage: input.pilot.stage,
    limitedLiveEnabled: input.pilot.limitedLiveEnabled,
    assuranceAssessmentId: input.pilot.assuranceAssessmentId,
    goLiveAssessmentId: input.pilot.goLiveAssessmentId,
  });
  if (!live.ok && input.operation === "limited_live_submit") {
    reasons.push(...live.reasons);
  }
  return { allowed: reasons.length === 0, reasons };
}
