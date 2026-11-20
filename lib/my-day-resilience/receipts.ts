import type {
  DecisionReceipt,
  JourneyPhase,
  MyDayPlan,
  ScenarioEvent,
  SourceEvidence,
  UserDecision,
} from "@/lib/my-day-resilience/types";

export function issueDecisionReceipt(input: {
  plan: MyDayPlan;
  phase: JourneyPhase;
  decisions: UserDecision[];
  chosenProposalId?: string;
  rejectedProposalIds: string[];
  evidence: SourceEvidence[];
  escalationReason?: string;
}): DecisionReceipt {
  const explainability = [
    `Goal: ${input.plan.goalStatement}`,
    `Phase at issue: ${input.phase}`,
    input.chosenProposalId
      ? `Chosen proposal: ${input.chosenProposalId} (canExecute=false)`
      : "No proposal chosen",
    input.rejectedProposalIds.length > 0
      ? `Rejected proposals (will not reappear): ${input.rejectedProposalIds.join(", ")}`
      : "No rejected proposals",
    input.escalationReason
      ? `Escalation: ${input.escalationReason}`
      : "No human escalation reason recorded",
    "Evidence honesty labels are preserved; fictional/declared never become verified.",
    "noOperationalChangeMade=true; canBook=false; productionClaim=none.",
  ];

  return {
    receiptId: `receipt_${input.plan.planId}_${input.decisions.length}`,
    planId: input.plan.planId,
    tenantId: input.plan.tenantId,
    phase: input.phase,
    decisions: input.decisions.map((d) => ({ ...d })),
    chosenProposalId: input.chosenProposalId,
    rejectedProposalIds: [...input.rejectedProposalIds],
    evidence: input.evidence.map((e) => ({ ...e })),
    escalationReason: input.escalationReason,
    noOperationalChangeMade: true,
    canBook: false,
    productionClaim: "none",
    issuedAt: "2026-11-09T10:00:00.000Z",
    explainability,
  };
}

/**
 * Deterministic reconstruction of terminal phase from an immutable event log.
 */
export function replayFromEvents(events: ScenarioEvent[]): {
  phase: JourneyPhase;
  declinedProposalIds: string[];
  receiptIssued: boolean;
} {
  let phase: JourneyPhase = "consent_gate";
  const declinedProposalIds: string[] = [];
  let receiptIssued = false;

  for (const event of events) {
    switch (event.type) {
      case "consent_denied":
        phase = "blocked";
        break;
      case "consent_withdrawn":
        phase = "blocked";
        break;
      case "consent_granted":
        phase = "plan_edit";
        break;
      case "dependencies_evaluated":
        phase = "scenario_ready";
        break;
      case "disruption_injected":
        phase = "disruption_injected";
        break;
      case "recovery_options_presented":
        phase = "recovery_options";
        break;
      case "proposal_declined": {
        const id = String(event.payload.proposalId ?? "");
        if (id) declinedProposalIds.push(id);
        break;
      }
      case "human_escalation":
      case "human_help_requested":
        phase = "human_escalation";
        break;
      case "proposal_accepted":
      case "activity_deferred":
        phase = "participant_approved";
        break;
      case "receipt_issued":
        receiptIssued = true;
        phase = "receipt_issued";
        break;
      case "replay_ready":
        phase = "replay_ready";
        break;
      case "returned_to_plan_edit":
        phase = "plan_edit";
        break;
      default:
        break;
    }
  }

  return { phase, declinedProposalIds, receiptIssued };
}
