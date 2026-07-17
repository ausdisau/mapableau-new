import { auraFlags } from "../feature-flags";
import type { AuraProposalActionType } from "../proposals";

export type AuraExecutionMode =
  | "demo"
  | "shadow"
  | "supervised_pilot"
  | "production";

function envTrue(name: string): boolean {
  const v = process.env[name];
  return v === "true" || v === "1";
}

export function getExecutionMode(): AuraExecutionMode {
  const raw = process.env.MAPABLE_AURA_EXECUTION_MODE ?? "shadow";
  if (
    raw === "demo" ||
    raw === "shadow" ||
    raw === "supervised_pilot" ||
    raw === "production"
  ) {
    return raw;
  }
  return "shadow";
}

const ACTION_FLAG: Record<AuraProposalActionType, string> = {
  venue_verification_request: "MAPABLE_AURA_EXECUTE_VENUE_VERIFICATION",
  visit_plan_share: "MAPABLE_AURA_EXECUTE_VISIT_PLAN_SHARE",
  supporter_notification: "MAPABLE_AURA_EXECUTE_SUPPORTER_NOTIFICATION",
  transport_request: "MAPABLE_AURA_EXECUTE_TRANSPORT_REQUEST",
  barrier_report: "MAPABLE_AURA_EXECUTE_BARRIER_REPORT",
};

export function isActionExecutionFlagEnabled(
  actionType: AuraProposalActionType,
): boolean {
  if (process.env.NODE_ENV === "test") {
    return process.env.MAPABLE_AURA_TEST_EXECUTION === "true";
  }
  return envTrue(ACTION_FLAG[actionType]);
}

/** Whether deterministic execution may perform application writes for this action. */
export function isActionExecutionEnabled(
  actionType: AuraProposalActionType,
): boolean {
  if (auraFlags.physicalActions || auraFlags.writeExecution) {
    return false;
  }
  const mode = getExecutionMode();
  if (mode === "shadow") return false;
  if (mode === "demo") {
    return isActionExecutionFlagEnabled(actionType);
  }
  if (mode === "supervised_pilot" || mode === "production") {
    return isActionExecutionFlagEnabled(actionType);
  }
  return false;
}

export function assertExecutionNotShadowOnly(): void {
  if (getExecutionMode() === "shadow" && process.env.NODE_ENV !== "test") {
    throw new Error("AURA_EXECUTION_MODE_SHADOW");
  }
}

export function wave5MemoryEnabled(): boolean {
  if (!envTrue("MAPABLE_AURA_MEMORY_ENABLED")) return false;
  return wave4ReleaseGatePassed();
}

export function wave5MemorySuggestionsEnabled(): boolean {
  return (
    wave5MemoryEnabled() &&
    envTrue("MAPABLE_AURA_MEMORY_SUGGESTIONS_ENABLED")
  );
}

export function wave5OutcomeCalibrationEnabled(): boolean {
  if (!envTrue("MAPABLE_AURA_OUTCOME_CALIBRATION_ENABLED")) return false;
  return wave4ReleaseGatePassed();
}

export function wave5EvidenceCorrectionsEnabled(): boolean {
  if (!envTrue("MAPABLE_AURA_EVIDENCE_CORRECTIONS_ENABLED")) return false;
  return wave4ReleaseGatePassed();
}

export function wave5ReliabilityCalibrationEnabled(): boolean {
  if (!envTrue("MAPABLE_AURA_RELIABILITY_CALIBRATION_ENABLED")) return false;
  return wave4ReleaseGatePassed();
}

let releaseGateCached: boolean | null = null;

export function wave4ReleaseGatePassed(): boolean {
  if (process.env.MAPABLE_AURA_WAVE4_GATE_PASSED === "true") {
    return true;
  }
  if (releaseGateCached !== null) return releaseGateCached;
  return false;
}

export function setWave4ReleaseGatePassed(passed: boolean): void {
  releaseGateCached = passed;
}

export function resetExecutionFlagsCache(): void {
  releaseGateCached = null;
}
