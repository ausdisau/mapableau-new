import type {
  CoordinationDecision,
  MandateAction,
  PolicyDecision,
  RequestKind,
  SafeguardContext,
} from "@/lib/care-intelligence/types";

export interface PolicyFacts {
  requestKind: RequestKind;
  participantStop: boolean;
  mandateActive: boolean;
  consentPresent: boolean;
  mandateAction: MandateAction | null;
  mandateAllowsAction: boolean;
  autonomyLevel: 0 | 1 | 2 | 3;
  missingFields: string[];
  disruption:
    | "none"
    | "worker_cancelled"
    | "vehicle_cancelled"
    | "linked_cancellation"
    | "vehicle_delay";
  delayWithinMandate: boolean;
  planCount: number;
  familiarWorkerPlanAvailable: boolean;
  untrustedContentRemoved: boolean;
  safeguardContext: SafeguardContext;
}

export function decidePolicy(facts: PolicyFacts): PolicyDecision {
  const ruleIds: string[] = [];
  const reasons: string[] = [];
  if (facts.untrustedContentRemoved) {
    ruleIds.push("CSI-UNTRUSTED-CONTENT-01");
    reasons.push("Instruction-like provider content was excluded.");
  }

  if (
    facts.requestKind === "clinical_decision" ||
    facts.requestKind === "funding_decision" ||
    facts.requestKind === "restrictive_practice"
  )
    return result(
      "refuse",
      0,
      [...ruleIds, "CSI-PROHIBITED-DECISION-01"],
      [...reasons, "The requested decision is outside MapAble's authority."],
      ["Involve the appropriately qualified human decision-maker."],
    );

  if (facts.requestKind === "emergency_action")
    return result(
      "escalate",
      0,
      [...ruleIds, "CSI-EMERGENCY-HANDOFF-01"],
      [...reasons, "Emergency action remains in the agreed human pathway."],
      ["Use the participant's agreed emergency protocol immediately."],
    );

  if (facts.participantStop)
    return result(
      "blocked",
      0,
      [...ruleIds, "CSI-PARTICIPANT-STOP-01"],
      [...reasons, "The participant stop control is active."],
      ["Do not inspect candidates or prepare action intents."],
    );

  if (!facts.mandateActive)
    return result(
      "blocked",
      0,
      [...ruleIds, "CSI-MANDATE-INACTIVE-01"],
      [...reasons, "The participant mandate is inactive."],
      ["Ask the participant whether they want to create or renew a mandate."],
    );

  if (facts.missingFields.length > 0)
    return result(
      "clarify",
      1,
      [...ruleIds, "CSI-REQUIRED-DETAILS-01"],
      [...reasons, `Missing: ${facts.missingFields.join(", ")}.`],
      ["Ask the participant for only the missing details."],
    );

  if (facts.disruption === "none")
    return result(
      "monitor",
      1,
      [...ruleIds, "CSI-MONITOR-ONLY-01"],
      [...reasons, "The linked support journey is stable."],
      ["Continue monitoring without preparing an action."],
    );

  if (!facts.consentPresent)
    return result(
      "blocked",
      0,
      [...ruleIds, "CSI-CONSENT-SCOPE-01"],
      [...reasons, "Required synthetic comparison consent is absent."],
      ["Ask the participant to review the requested data scope."],
    );

  if (!facts.mandateAction || !facts.mandateAllowsAction)
    return result(
      "blocked",
      0,
      [...ruleIds, "CSI-MANDATE-SCOPE-01"],
      [...reasons, "The recovery action is outside the mandate."],
      ["Ask the participant or an authorised human to review the disruption."],
    );

  if (facts.autonomyLevel === 0)
    return result(
      "escalate",
      0,
      [...ruleIds, "CSI-AUTONOMY-LEVEL-01"],
      [...reasons, "The participant selected information-only autonomy."],
      ["A participant-authorised human should coordinate any change."],
    );

  if (facts.disruption === "vehicle_delay" && !facts.delayWithinMandate)
    return result(
      "escalate",
      1,
      [...ruleIds, "CSI-DELAY-LIMIT-01"],
      [...reasons, "The delay exceeds the delegated time limit."],
      ["Ask a participant-authorised human to coordinate the response."],
    );

  if (facts.planCount === 0)
    return result(
      "escalate",
      1,
      [...ruleIds, "CSI-NO-COMPLETE-PLAN-01"],
      [
        ...reasons,
        "No complete recovery plan passed access, credential, time and combined-price constraints.",
      ],
      ["Ask a participant-authorised human to review alternatives."],
    );

  if (
    facts.safeguardContext.serviceCriticality === "high" &&
    (facts.disruption === "worker_cancelled" ||
      facts.disruption === "linked_cancellation") &&
    !facts.familiarWorkerPlanAvailable
  )
    return result(
      "escalate",
      1,
      [...ruleIds, "CSI-HIGH-CONSEQUENCE-CHANGE-01"],
      [
        ...reasons,
        "A high-criticality support would require an unfamiliar worker.",
      ],
      ["Require participant and human coordinator review."],
    );

  return result(
    "propose",
    Math.min(facts.autonomyLevel, 3) as 1 | 2 | 3,
    [...ruleIds, "CSI-PREPARE-WITH-CONFIRMATION-01"],
    [...reasons, "One or more bounded recovery plans are available."],
    ["Present alternatives and wait for participant confirmation."],
  );
}

function result(
  decision: CoordinationDecision,
  autonomyLevel: 0 | 1 | 2 | 3,
  ruleIds: string[],
  reasons: string[],
  requiredNextSteps: string[],
): PolicyDecision {
  return { decision, autonomyLevel, ruleIds, reasons, requiredNextSteps };
}
