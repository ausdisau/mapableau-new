import type { PilotReviewOutcome } from "@prisma/client";

export function recommendReviewOutcome(input: {
  openCriticalSignals: number;
  openCorrectiveActions: number;
  limitBreaches: number;
  checklistComplete: boolean;
}): { outcome: PilotReviewOutcome; rationale: string } {
  if (!input.checklistComplete) {
    return {
      outcome: "insufficient_evidence",
      rationale: "Required checklist items incomplete",
    };
  }
  if (input.openCriticalSignals > 0) {
    return {
      outcome: "pause_recommended",
      rationale: "Critical safety signals open",
    };
  }
  if (input.limitBreaches > 0) {
    return {
      outcome: "escalate",
      rationale: "Limit breaches require escalation",
    };
  }
  if (input.openCorrectiveActions > 0) {
    return {
      outcome: "continue_with_actions",
      rationale: "Continue with open corrective actions",
    };
  }
  return { outcome: "continue", rationale: "No blocking findings" };
}
