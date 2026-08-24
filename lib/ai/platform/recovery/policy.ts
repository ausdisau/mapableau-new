import type { MaterialityGate } from "./types";

export const FORBIDDEN_AUTO_OPERATIONS = [
  "assign_worker","book_transport","approve_payment","disclose_disability","change_consent",
  "contact_employer","clinical_decision","safeguarding_substantiation","irreversible_operation",
] as const;
export type ForbiddenAutoOperation = (typeof FORBIDDEN_AUTO_OPERATIONS)[number];

export function assertRecoveryAuthority(input: { operation: string; materialityGate: MaterialityGate }): { allowed: boolean; reason: string } {
  if (FORBIDDEN_AUTO_OPERATIONS.includes(input.operation as ForbiddenAutoOperation)) {
    return { allowed: false, reason: `${input.operation} requires participant approval and Action Kernel execution (Prompt 02).` };
  }
  if (input.materialityGate === "BLOCKED") return { allowed: false, reason: "Recovery is blocked — human intervention required." };
  if (input.materialityGate === "HUMAN_REVIEW_REQUIRED") return { allowed: false, reason: "Human review must complete before any operational action." };
  return { allowed: true, reason: "Read-only recovery planning permitted." };
}

export function mayAutoReassess(killSwitchActive: boolean): boolean { return !killSwitchActive; }
export function participantMustDecide(materialityGate: MaterialityGate): boolean {
  return ["PARTICIPANT_DECISION_REQUIRED","REAPPROVAL_REQUIRED"].includes(materialityGate);
}
