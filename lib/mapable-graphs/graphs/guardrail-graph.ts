import {
  evaluateActionAgainstRules,
  getActiveGuardrailRules,
} from "@/lib/mapable-graphs/guardrail-rules";
import { graphRepository } from "@/lib/mapable-graphs/repository";
import type { GuardrailEvaluationResult } from "@/lib/mapable-graphs/types";

export async function recordGuardrailRule(
  participantId: string | null,
  ruleId: string,
  title: string
) {
  return graphRepository.createNode({
    graphType: "guardrail",
    nodeType: "GuardrailRule",
    participantId: participantId ?? undefined,
    label: title,
    entityId: ruleId,
    status: "active",
    data: { ruleId },
  });
}

export async function evaluateActionAgainstRulesGraph(
  participantId: string,
  action: string,
  context: Record<string, unknown> = {}
): Promise<GuardrailEvaluationResult> {
  const rules = await getActiveGuardrailRules();
  return evaluateActionAgainstRules(action, { ...context, participantId }, rules);
}

export async function recordPolicyDecision(
  participantId: string,
  evaluation: GuardrailEvaluationResult,
  action: string,
  actorId?: string
) {
  const decision = await graphRepository.createNode({
    graphType: "guardrail",
    nodeType: "PolicyDecision",
    participantId,
    label: evaluation.outcome,
    status: "recorded",
    data: {
      action,
      riskTier: evaluation.riskTier,
      explanation: evaluation.explanation,
      ruleIds: evaluation.ruleIds,
    },
    createdBy: actorId,
  });

  if (evaluation.checkpointRequired) {
    await createCheckpointRequiredNode(
      participantId,
      decision.id,
      evaluation.outcome
    );
  }

  await graphRepository.recordGraphEvent({
    graphType: "guardrail",
    participantId,
    eventType: "policy.evaluated",
    relatedNodeId: decision.id,
    actorId,
    payload: evaluation as unknown as Record<string, unknown>,
  });

  return decision;
}

export async function linkDecisionToAction(
  participantId: string,
  decisionId: string,
  targetNodeId: string
) {
  return graphRepository.createEdge({
    graphType: "guardrail",
    edgeType: "TRIGGERED",
    fromNodeId: decisionId,
    toNodeId: targetNodeId,
    participantId,
  });
}

export async function createCheckpointRequiredNode(
  participantId: string,
  policyDecisionId: string,
  checkpointType: string
) {
  const checkpoint = await graphRepository.createNode({
    graphType: "guardrail",
    nodeType: "Checkpoint",
    participantId,
    label: checkpointType,
    status: "pending",
    data: { requiresParticipantOrHuman: true },
  });
  await graphRepository.createEdge({
    graphType: "guardrail",
    edgeType: "REQUIRES_CHECKPOINT",
    fromNodeId: policyDecisionId,
    toNodeId: checkpoint.id,
    participantId,
  });
  return checkpoint;
}

export async function escalateSafeguarding(
  participantId: string,
  reason: string,
  actorId?: string
) {
  const signal = await graphRepository.createNode({
    graphType: "guardrail",
    nodeType: "RiskSignal",
    participantId,
    label: "Safeguarding escalation",
    status: "active",
    data: { tier: "tier_4", reason },
    createdBy: actorId,
  });
  const evaluation: GuardrailEvaluationResult = {
    outcome: "ESCALATE_SAFEGUARDING",
    riskTier: "tier_4",
    explanation: reason,
    checkpointRequired: true,
    ruleIds: ["ndis_safeguarding"],
  };
  const decision = await recordPolicyDecision(
    participantId,
    evaluation,
    "safeguarding_escalation",
    actorId
  );
  await graphRepository.createEdge({
    graphType: "guardrail",
    edgeType: "ESCALATED_TO",
    fromNodeId: signal.id,
    toNodeId: decision.id,
    participantId,
  });
  await graphRepository.recordGraphEvent({
    graphType: "guardrail",
    participantId,
    eventType: "safeguarding.escalated",
    relatedNodeId: signal.id,
    payload: { reason, bookingFlowPaused: true },
  });
  return { signal, decision };
}
