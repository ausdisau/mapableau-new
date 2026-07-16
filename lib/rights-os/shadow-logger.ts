import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { isRightsOsEnabled } from "@/lib/rights-os/config";
import { explainPolicyDecision } from "@/lib/rights-os/explain";
import { prisma } from "@/lib/prisma";
import type {
  RightsDataUseRequestInput,
  RightsPolicyDecisionResult,
} from "@/lib/rights-os/types";

export async function persistDataUseRequest(input: RightsDataUseRequestInput) {
  return prisma.rightsDataUseRequest.create({
    data: {
      requestId: input.requestId,
      subjectUserId: input.subjectUserId,
      requesterActorId: input.requester.actorId,
      requesterActorType: input.requester.actorType,
      requesterOrganisationId: input.requester.organisationId,
      requesterRole: input.requester.role,
      recipientDisplayName: input.recipient.displayName,
      recipientActorId: input.recipient.actorId,
      recipientOrganisationId: input.recipient.organisationId,
      recipientServiceId: input.recipient.serviceId,
      purposeCode: input.purposeCode,
      requestedOperations: [...input.requestedOperations],
      requestedFields: input.requestedFields,
      sourceAssets: input.sourceAssets,
      contextJson: input.context,
      requestedAt: new Date(input.requestedAt),
      requestedUntil: input.requestedUntil ? new Date(input.requestedUntil) : undefined,
      onwardSharingRequested: input.onwardSharingRequested,
      retentionRequested: input.retentionRequested,
      status: "pending",
    },
  });
}

export async function persistPolicyDecision(
  dbRequestId: string,
  subjectUserId: string,
  decision: RightsPolicyDecisionResult
) {
  return prisma.rightsPolicyDecision.create({
    data: {
      decisionId: decision.decisionId,
      requestId: dbRequestId,
      subjectUserId,
      outcome: decision.outcome,
      allowedFields: decision.allowedFields,
      deniedFields: decision.deniedFields,
      allowedOperations: decision.allowedOperations,
      deniedOperations: decision.deniedOperations,
      dutiesJson: decision.duties,
      prohibitionsJson: decision.prohibitions,
      requiredApprovals: decision.requiredApprovals,
      requiredAuthorityRecords: decision.requiredAuthorityRecords,
      reasonsJson: decision.reasons,
      policyVersion: decision.policyVersion,
      expiresAt: decision.expiresAt ? new Date(decision.expiresAt) : undefined,
      evaluatedAt: new Date(decision.evaluatedAt),
    },
  });
}

export async function logShadowEvaluation(params: {
  actorUserId: string;
  subjectUserId: string;
  requestId: string;
  decision: RightsPolicyDecisionResult;
  organisationId?: string;
}) {
  const explanation = explainPolicyDecision(params.decision);

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "rights.policy_evaluated",
    entityType: "RightsPolicyDecision",
    entityId: params.decision.decisionId,
    participantId: params.subjectUserId,
    organisationId: params.organisationId,
    metadata: {
      requestId: params.requestId,
      outcome: params.decision.outcome,
      purposeVersion: params.decision.policyVersion,
      allowedFieldCount: params.decision.allowedFields.length,
      deniedFieldCount: params.decision.deniedFields.length,
      mode: "shadow",
      explanation: explanation.decision,
    },
  });
}

export async function shadowEvaluateAndLog(params: {
  input: RightsDataUseRequestInput;
  actorUserId: string;
  conflictContext?: Parameters<
    typeof import("@/lib/rights-os/policy-evaluator").evaluatePolicy
  >[1];
}) {
  if (!isRightsOsEnabled()) {
    return null;
  }

  const { evaluatePolicy } = await import("@/lib/rights-os/policy-evaluator");
  const decision = evaluatePolicy(params.input, params.conflictContext);
  const record = await persistDataUseRequest(params.input);
  await persistPolicyDecision(record.id, params.input.subjectUserId, decision);
  await logShadowEvaluation({
    actorUserId: params.actorUserId,
    subjectUserId: params.input.subjectUserId,
    requestId: params.input.requestId,
    decision,
    organisationId: params.input.recipient.organisationId,
  });

  await prisma.rightsDataUseRequest.update({
    where: { id: record.id },
    data: { status: "evaluated" },
  });

  return { record, decision };
}
