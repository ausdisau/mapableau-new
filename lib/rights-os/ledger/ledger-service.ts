import { createHash, randomBytes, randomUUID } from "crypto";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { evaluatePolicy } from "@/lib/rights-os/policy-evaluator";
import type { RightsDataUseRequestInput } from "@/lib/rights-os/types";

export async function getActiveAccess(subjectUserId: string) {
  const leases = await prisma.rightsCapabilityLease.findMany({
    where: {
      subjectUserId,
      status: "active",
      expiresAt: { gt: new Date() },
    },
    orderBy: { expiresAt: "asc" },
  });

  const capsules = await prisma.accessCapsule.findMany({
    where: {
      subjectUserId,
      status: { in: ["issued", "presented", "verified"] },
      expiresAt: { gt: new Date() },
    },
    orderBy: { expiresAt: "asc" },
  });

  return { leases, capsules };
}

export async function getRightsHistory(subjectUserId: string) {
  const [requests, auditEvents] = await Promise.all([
    prisma.rightsDataUseRequest.findMany({
      where: { subjectUserId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { decisions: { orderBy: { evaluatedAt: "desc" }, take: 1 } },
    }),
    prisma.auditEvent.findMany({
      where: {
        participantId: subjectUserId,
        action: { startsWith: "rights." },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return { requests, auditEvents };
}

export async function generateLedgerManifest(subjectUserId: string) {
  const history = await getRightsHistory(subjectUserId);
  const manifest = {
    subjectUserId,
    generatedAt: new Date().toISOString(),
    entries: history.auditEvents.map((e) => ({
      action: e.action,
      entityType: e.entityType,
      entityId: e.entityId,
      createdAt: e.createdAt.toISOString(),
      metadata: e.metadata,
    })),
    activeAccess: await getActiveAccess(subjectUserId),
  };

  const record = await prisma.rightsLedgerManifest.create({
    data: {
      subjectUserId,
      manifestJson: manifest,
      eventCount: history.auditEvents.length,
    },
  });

  return { manifest, record };
}

export async function revokeLease(leaseId: string, actorUserId: string) {
  const lease = await prisma.rightsCapabilityLease.update({
    where: { id: leaseId },
    data: { status: "revoked", revokedAt: new Date() },
  });

  await createAuditEvent({
    actorUserId,
    action: "rights.lease_revoked",
    entityType: "RightsCapabilityLease",
    entityId: lease.id,
    participantId: lease.subjectUserId,
  });

  return lease;
}

export async function issueCapabilityLease(params: {
  subjectUserId: string;
  policyDecisionId: string;
  purposeCode: string;
  permittedFields: string[];
  permittedOperations: RightsDataUseRequestInput["requestedOperations"];
  requesterActorId: string;
  recipientOrganisationId?: string;
  expiresAt: Date;
  participantApprovalRef?: string;
}) {
  const lease = await prisma.rightsCapabilityLease.create({
    data: {
      subjectUserId: params.subjectUserId,
      policyDecisionId: params.policyDecisionId,
      purposeCode: params.purposeCode,
      permittedFields: params.permittedFields,
      permittedOperations: [...params.permittedOperations],
      requesterActorId: params.requesterActorId,
      recipientOrganisationId: params.recipientOrganisationId,
      expiresAt: params.expiresAt,
      participantApprovalRef: params.participantApprovalRef,
      status: "active",
    },
  });

  await createAuditEvent({
    actorUserId: params.requesterActorId,
    action: "rights.lease_issued",
    entityType: "RightsCapabilityLease",
    entityId: lease.id,
    participantId: params.subjectUserId,
    organisationId: params.recipientOrganisationId,
  });

  return lease;
}

export function hashSecureToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function generateSecureToken() {
  return randomBytes(32).toString("base64url");
}

export async function approveDataUseRequest(params: {
  requestDbId: string;
  actorUserId: string;
}) {
  const record = await prisma.rightsDataUseRequest.findUnique({
    where: { id: params.requestDbId },
    include: { decisions: { orderBy: { evaluatedAt: "desc" }, take: 1 } },
  });
  if (!record || !record.decisions[0]) {
    throw new Error("REQUEST_OR_DECISION_NOT_FOUND");
  }

  const decision = record.decisions[0];
  const expiresAt =
    decision.expiresAt ?? new Date(Date.now() + 4 * 3600_000);

  const lease = await issueCapabilityLease({
    subjectUserId: record.subjectUserId,
    policyDecisionId: decision.id,
    purposeCode: record.purposeCode,
    permittedFields: decision.allowedFields,
    permittedOperations: decision.allowedOperations,
    requesterActorId: record.requesterActorId,
    recipientOrganisationId: record.recipientOrganisationId ?? undefined,
    expiresAt,
    participantApprovalRef: params.actorUserId,
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "rights.participant_approved",
    entityType: "RightsDataUseRequest",
    entityId: record.id,
    participantId: record.subjectUserId,
  });

  return lease;
}

export async function createShadowRequestForEvaluation(
  input: RightsDataUseRequestInput,
  actorUserId: string
) {
  const decision = evaluatePolicy(input);
  const record = await prisma.rightsDataUseRequest.create({
    data: {
      requestId: input.requestId || randomUUID(),
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
      status: "evaluated",
    },
  });

  await prisma.rightsPolicyDecision.create({
    data: {
      decisionId: decision.decisionId,
      requestId: record.id,
      subjectUserId: input.subjectUserId,
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
    },
  });

  await createAuditEvent({
    actorUserId,
    action: "rights.policy_evaluated",
    entityType: "RightsPolicyDecision",
    entityId: decision.decisionId,
    participantId: input.subjectUserId,
    metadata: { outcome: decision.outcome, mode: "shadow" },
  });

  return { record, decision };
}
