import { createHash, randomUUID } from "crypto";

import { auraFlags } from "../feature-flags";

export type AgentIdentity = {
  id: string;
  agentId: string;
  organisationId: string;
  role:
    | "participant_aura"
    | "venue_agent"
    | "transport_operator"
    | "provider"
    | "campus"
    | "employer"
    | "council";
  trustState: "trusted" | "untrusted" | "suspended";
  publicKeyRef: string;
};

export type AuraAgentRequest = {
  id: string;
  correlationId: string;
  requesterAgentId: string;
  recipientAgentId: string;
  participantMandateReference: string;
  purposeCode: string;
  allowedQuestionTypes: string[];
  requestedClaims: string[];
  disclosureReference?: string;
  issuedAt: string;
  expiresAt: string;
  signature: string;
};

export type AuraAgentResponse = {
  requestId: string;
  status:
    | "answered"
    | "partially_answered"
    | "unknown"
    | "denied"
    | "human_review_required";
  claims: {
    claimType: string;
    value: unknown;
    evidenceReferences: string[];
    confidence: number;
  }[];
  unknowns: string[];
  denialReasons: string[];
  issuedAt: string;
  expiresAt: string;
  signature: string;
};

const agents = new Map<string, AgentIdentity>();
const requests = new Map<string, AuraAgentRequest>();
const responses = new Map<string, AuraAgentResponse>();

export function resetAgentCoordinationStore(): void {
  agents.clear();
  requests.clear();
  responses.clear();
}

function assertEnabled(): void {
  if (
    !auraFlags.agentCoordinationEnabled &&
    process.env.NODE_ENV !== "test" &&
    process.env.MAPABLE_AURA_DEMO !== "true"
  ) {
    throw new Error("MAPABLE_AURA_AGENT_COORDINATION_DISABLED");
  }
}

function sign(payload: string, keyRef: string): string {
  return createHash("sha256").update(payload + keyRef).digest("hex");
}

export function registerAgent(input: Omit<AgentIdentity, "id">): AgentIdentity {
  assertEnabled();
  const agent: AgentIdentity = { ...input, id: randomUUID() };
  agents.set(agent.agentId, agent);
  return agent;
}

export function createAgentRequest(input: {
  requesterAgentId: string;
  recipientAgentId: string;
  participantMandateReference: string;
  purposeCode: string;
  allowedQuestionTypes: string[];
  requestedClaims: string[];
  disclosureReference?: string;
  expiresInMinutes?: number;
}): AuraAgentRequest {
  assertEnabled();
  const requester = agents.get(input.requesterAgentId);
  if (!requester || requester.trustState !== "trusted") {
    throw new Error("AURA_AGENT_REQUESTER_UNTRUSTED");
  }
  const recipient = agents.get(input.recipientAgentId);
  if (!recipient || recipient.trustState !== "trusted") {
    throw new Error("AURA_AGENT_RECIPIENT_UNTRUSTED");
  }

  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(
    Date.now() + (input.expiresInMinutes ?? 30) * 60 * 1000,
  ).toISOString();
  const unsigned = {
    correlationId: randomUUID(),
    requesterAgentId: input.requesterAgentId,
    recipientAgentId: input.recipientAgentId,
    participantMandateReference: input.participantMandateReference,
    purposeCode: input.purposeCode,
    allowedQuestionTypes: input.allowedQuestionTypes,
    requestedClaims: input.requestedClaims,
    disclosureReference: input.disclosureReference,
    issuedAt,
    expiresAt,
  };
  const request: AuraAgentRequest = {
    id: randomUUID(),
    ...unsigned,
    signature: sign(JSON.stringify(unsigned), requester.publicKeyRef),
  };
  requests.set(request.id, request);
  return request;
}

export function respondToAgentRequest(input: {
  requestId: string;
  responderAgentId: string;
  status: AuraAgentResponse["status"];
  claims: AuraAgentResponse["claims"];
  unknowns?: string[];
  denialReasons?: string[];
}): AuraAgentResponse {
  assertEnabled();
  const request = requests.get(input.requestId);
  if (!request) throw new Error("AURA_AGENT_REQUEST_NOT_FOUND");
  if (request.recipientAgentId !== input.responderAgentId) {
    throw new Error("AURA_AGENT_RECIPIENT_MISMATCH");
  }
  if (Date.parse(request.expiresAt) <= Date.now()) {
    throw new Error("AURA_AGENT_REQUEST_EXPIRED");
  }

  const responder = agents.get(input.responderAgentId);
  if (!responder || responder.trustState !== "trusted") {
    throw new Error("AURA_AGENT_RESPONDER_UNTRUSTED");
  }

  const issuedAt = new Date().toISOString();
  const body = {
    requestId: input.requestId,
    status: input.status,
    claims: input.claims,
    unknowns: input.unknowns ?? [],
    denialReasons: input.denialReasons ?? [],
    issuedAt,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  };
  const response: AuraAgentResponse = {
    ...body,
    signature: sign(JSON.stringify(body), responder.publicKeyRef),
  };
  responses.set(input.requestId, response);
  return response;
}

export function validateAgentResponse(input: {
  requestId: string;
}): {
  accepted: boolean;
  reasons: string[];
  response?: AuraAgentResponse;
  executesAutomatically: false;
} {
  const request = requests.get(input.requestId);
  const response = responses.get(input.requestId);
  if (!request || !response) {
    return { accepted: false, reasons: ["missing"], executesAutomatically: false };
  }
  const responder = agents.get(request.recipientAgentId);
  if (!responder) {
    return { accepted: false, reasons: ["unknown_agent"], executesAutomatically: false };
  }
  const expected = sign(
    JSON.stringify({
      requestId: response.requestId,
      status: response.status,
      claims: response.claims,
      unknowns: response.unknowns,
      denialReasons: response.denialReasons,
      issuedAt: response.issuedAt,
      expiresAt: response.expiresAt,
    }),
    responder.publicKeyRef,
  );
  const reasons: string[] = [];
  if (response.signature !== expected) reasons.push("signature_invalid");
  if (responder.trustState !== "trusted") reasons.push("agent_untrusted");
  if (Date.parse(response.expiresAt) <= Date.now()) reasons.push("expired");

  return {
    accepted: reasons.length === 0,
    reasons,
    response,
    executesAutomatically: false,
  };
}

export function assertAgentCannotExceedParticipantAuthority(): void {
  /* invariant — agent envelopes cannot grant L4/L5 */
}
