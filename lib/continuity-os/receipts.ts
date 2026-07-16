import type { RecoveryOutcomeState } from "@/lib/continuity-os/types";

export interface RecoveryReceiptDraft {
  originalGoal: string;
  failure: string;
  affectedServices: string[];
  optionSelected: string;
  participantApprovalId: string;
  actionsTaken: string[];
  recordsCreated: string[];
  communicationsDelivered: string[];
  handoffsAccepted: string[];
  postconditions: Array<{ key: string; passed: boolean; evidence?: string }>;
  remainingUnknowns: string[];
  financialEffects: string[];
  complaintOrReviewOptions: string[];
  outcome: RecoveryOutcomeState;
  evidence: string[];
  timestamp: string;
  limitations: string[];
  /** Explicit distinctions required by ContinuityOS invariants. */
  serviceActionCompleted: boolean;
  realWorldOutcomeConfirmed: boolean;
  participantGoalAchieved: boolean;
}

/**
 * Build an immutable participant-facing recovery receipt draft.
 * Distinguishes service action vs real-world outcome vs goal achievement.
 */
export function buildRecoveryReceipt(
  input: Omit<
    RecoveryReceiptDraft,
    | "serviceActionCompleted"
    | "realWorldOutcomeConfirmed"
    | "participantGoalAchieved"
    | "limitations"
  > & { limitations?: string[] }
): RecoveryReceiptDraft {
  const allPostconditionsPassed =
    input.postconditions.length > 0 &&
    input.postconditions.every((p) => p.passed);

  const serviceActionCompleted = input.actionsTaken.length > 0;

  // False recovery: action claimed but hard postcondition failed.
  const falseRecovery = serviceActionCompleted && !allPostconditionsPassed;

  const outcome: RecoveryOutcomeState = falseRecovery
    ? input.outcome === "restored" ||
      input.outcome === "restored_with_conditions" ||
      input.outcome === "alternative_goal_completed"
      ? "partially_restored"
      : input.outcome
    : input.outcome;

  const realWorldOutcomeConfirmed =
    !falseRecovery &&
    allPostconditionsPassed &&
    (outcome === "restored" ||
      outcome === "restored_with_conditions" ||
      outcome === "alternative_goal_completed");
  const participantGoalAchieved =
    !falseRecovery &&
    (outcome === "restored" || outcome === "alternative_goal_completed");

  return {
    ...input,
    outcome,
    limitations: [
      ...(input.limitations ?? []),
      "A service acknowledgement is not a completed recovery.",
      "A request created is not a confirmed ride or assigned worker.",
      ...(falseRecovery
        ? ["False-recovery risk: postconditions not passed — recovery remains open."]
        : []),
    ],
    serviceActionCompleted,
    realWorldOutcomeConfirmed,
    participantGoalAchieved,
  };
}

export function detectFalseRecovery(params: {
  operatorAcknowledged: boolean;
  hardRequirementsMet: boolean;
}): { isFalseRecovery: boolean; reason: string } {
  if (params.operatorAcknowledged && !params.hardRequirementsMet) {
    return {
      isFalseRecovery: true,
      reason:
        "Operator acknowledgement preserved, but replacement failed hard access requirements — not a completed recovery",
    };
  }
  return { isFalseRecovery: false, reason: "" };
}
