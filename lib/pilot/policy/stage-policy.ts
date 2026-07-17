import type { PilotStage } from "@prisma/client";

export type PilotOperation =
  | "configure"
  | "enrol_participant"
  | "authorise_worker"
  | "reserve_limit"
  | "execute_transaction"
  | "advance_stage"
  | "limited_live_submit"
  | "pause"
  | "resume"
  | "daily_review"
  | "close";

const STAGE_OPS: Record<PilotStage, readonly PilotOperation[]> = {
  design: ["configure", "close"],
  readiness: ["configure", "enrol_participant", "authorise_worker", "advance_stage", "daily_review", "close"],
  sandbox: [
    "configure",
    "enrol_participant",
    "authorise_worker",
    "reserve_limit",
    "execute_transaction",
    "advance_stage",
    "pause",
    "resume",
    "daily_review",
    "close",
  ],
  dry_run: [
    "enrol_participant",
    "authorise_worker",
    "reserve_limit",
    "execute_transaction",
    "advance_stage",
    "pause",
    "resume",
    "daily_review",
    "close",
  ],
  shadow: [
    "enrol_participant",
    "authorise_worker",
    "reserve_limit",
    "execute_transaction",
    "advance_stage",
    "pause",
    "resume",
    "daily_review",
    "close",
  ],
  limited_live: [
    "enrol_participant",
    "authorise_worker",
    "reserve_limit",
    "execute_transaction",
    "limited_live_submit",
    "advance_stage",
    "pause",
    "resume",
    "daily_review",
    "close",
  ],
  controlled_live: [
    "enrol_participant",
    "authorise_worker",
    "reserve_limit",
    "execute_transaction",
    "limited_live_submit",
    "advance_stage",
    "pause",
    "resume",
    "daily_review",
    "close",
  ],
  wind_down: ["reserve_limit", "execute_transaction", "pause", "daily_review", "close"],
  closed: [],
};

export function isOperationAllowedAtStage(
  stage: PilotStage,
  operation: PilotOperation
): boolean {
  return STAGE_OPS[stage].includes(operation);
}

export function assertOperationAllowedAtStage(
  stage: PilotStage,
  operation: PilotOperation
): void {
  if (!isOperationAllowedAtStage(stage, operation)) {
    throw new Error(`PILOT_STAGE_OPERATION_DENIED:${stage}:${operation}`);
  }
}

export function requiresAssuranceForStage(stage: PilotStage): boolean {
  return stage === "limited_live" || stage === "controlled_live";
}

/** Limited live is blocked unless explicitly enabled AND assurance refs present. */
export function isLimitedLivePermitted(input: {
  stage: PilotStage;
  limitedLiveEnabled: boolean;
  assuranceAssessmentId: string | null | undefined;
  goLiveAssessmentId: string | null | undefined;
}): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (!requiresAssuranceForStage(input.stage)) {
    return { ok: true, reasons };
  }
  if (!input.limitedLiveEnabled) {
    reasons.push("LIMITED_LIVE_DISABLED_BY_DEFAULT");
  }
  if (!input.assuranceAssessmentId) {
    reasons.push("ASSURANCE_ASSESSMENT_REQUIRED");
  }
  if (!input.goLiveAssessmentId) {
    reasons.push("GO_LIVE_ASSESSMENT_REQUIRED");
  }
  return { ok: reasons.length === 0, reasons };
}
