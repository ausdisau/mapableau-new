import { checkConsent } from "@/lib/consent/consent-service";
import { graphRepository } from "@/lib/mapable-graphs/repository";

const SCOPE_TO_PRISMA: Record<string, string> = {
  share_access_needs_with_driver: "transport.accessibility_share",
  share_support_profile_with_provider: "care.accessibility_share",
  share_assessment_summary_with_coordinator: "support_coordination.access",
};

export async function createConsentRecord(
  participantId: string,
  scopeLabel: string,
  mode: "once" | "always" | "deny" = "always"
) {
  const record = await graphRepository.createNode({
    graphType: "consent",
    nodeType: "ConsentRecord",
    participantId,
    label: scopeLabel,
    status: mode === "deny" ? "denied" : "draft",
    data: { mode, scope: scopeLabel },
  });
  const dataScope = await graphRepository.createNode({
    graphType: "consent",
    nodeType: "DataScope",
    participantId,
    label: scopeLabel,
    status: mode === "deny" ? "inactive" : "active",
    data: { scope: scopeLabel, mode },
  });
  await graphRepository.createEdge({
    graphType: "consent",
    edgeType: "GOVERNED_BY",
    fromNodeId: record.id,
    toNodeId: dataScope.id,
    participantId,
  });
  return { record, dataScope };
}

export async function grantConsentScope(
  participantId: string,
  scope: string,
  recipientId?: string,
  mode: "once" | "always" = "always"
) {
  const { record, dataScope } = await createConsentRecord(
    participantId,
    scope,
    mode
  );
  if (recipientId) {
    const recipient = await graphRepository.createNode({
      graphType: "consent",
      nodeType: "DataRecipient",
      participantId,
      label: recipientId,
      entityId: recipientId,
      data: { recipientType: "user" },
    });
    await graphRepository.createEdge({
      graphType: "consent",
      edgeType: "SHARED_WITH",
      fromNodeId: dataScope.id,
      toNodeId: recipient.id,
      participantId,
      data: { mode },
    });
  }
  await createConsentAuditEvent(participantId, "consent.granted", {
    scope,
    mode,
    recordId: record.id,
  });
  return { record, dataScope };
}

export async function revokeConsentScope(
  participantId: string,
  consentNodeId: string,
  actorId?: string
) {
  const node = await graphRepository.updateNode(consentNodeId, {
    status: "revoked",
    data: { revokedAt: new Date().toISOString() },
  });
  await graphRepository.createEdge({
    graphType: "consent",
    edgeType: "REVOKED_BY",
    fromNodeId: consentNodeId,
    toNodeId: consentNodeId,
    participantId,
    createdBy: actorId,
    data: { note: "revocation marker" },
  }).catch(() => undefined);
  await createConsentAuditEvent(participantId, "consent.revoked", {
    consentNodeId,
    actorId,
  });
  return node;
}

export async function checkConsentForAction(params: {
  participantId: string;
  scope: string;
  grantedToUserId?: string;
}): Promise<{ allowed: boolean; graphConsent: boolean; prismaConsent: boolean }> {
  const graphNodes = await graphRepository.findNodes({
    graphType: "consent",
    participantId: params.participantId,
    nodeType: "DataScope",
  });
  const graphConsent = graphNodes.some(
    (n) =>
      n.status === "active" &&
      (n.data.scope === params.scope || n.label === params.scope)
  );

  const prismaScope = SCOPE_TO_PRISMA[params.scope];
  let prismaConsent = false;
  if (prismaScope) {
    prismaConsent = await checkConsent({
      subjectUserId: params.participantId,
      scope: prismaScope as never,
      grantedToUserId: params.grantedToUserId,
    });
  }

  return {
    allowed: graphConsent || prismaConsent,
    graphConsent,
    prismaConsent,
  };
}

export async function listActiveConsents(participantId: string) {
  const graph = await graphRepository.getGraphForParticipant(
    "consent",
    participantId
  );
  return graph.nodes.filter(
    (n) =>
      (n.nodeType === "ConsentRecord" || n.nodeType === "DataScope") &&
      n.status !== "revoked" &&
      n.status !== "denied"
  );
}

export async function createConsentAuditEvent(
  participantId: string,
  eventType: string,
  payload: Record<string, unknown>
) {
  return graphRepository.recordGraphEvent({
    graphType: "consent",
    participantId,
    eventType,
    payload,
    actorType: "system",
  });
}
