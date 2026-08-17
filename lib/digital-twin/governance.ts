import { createHash } from "crypto";

import type {
  TwinAuditEvent,
  TwinAuditEventType,
  TwinAttestation,
  TwinConsentEvent,
  TwinModerationDecision,
} from "@/lib/digital-twin/types";

const auditLog: TwinAuditEvent[] = [];
const attestations: TwinAttestation[] = [];
const consentEvents: TwinConsentEvent[] = [];
const moderationDecisions: TwinModerationDecision[] = [];

let eventCounter = 0;

function nextId(prefix: string): string {
  eventCounter += 1;
  return `${prefix}-${Date.now()}-${eventCounter}`;
}

export interface CreateAuditEventInput {
  eventType: TwinAuditEventType;
  entityType: string;
  entityId: string;
  actorId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Creates an in-memory audit event for the Digital Twin MVP.
 * TODO: Connect to prisma.auditEvent and MapAble smart-contract attestation layer.
 */
export function createAuditEvent(input: CreateAuditEventInput): TwinAuditEvent {
  const event: TwinAuditEvent = {
    id: nextId("twin-audit"),
    eventType: input.eventType,
    entityType: input.entityType,
    entityId: input.entityId,
    actorId: input.actorId,
    timestamp: new Date().toISOString(),
    metadata: redactSensitiveFields(input.metadata ?? {}),
  };
  auditLog.push(event);
  return event;
}

export interface CreateAttestationInput {
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
  attestedBy: string;
  notes?: string;
}

/**
 * Creates a deterministic attestation hash for evidence payloads.
 * Future: anchor hash on MapAble attestation registry / smart contracts.
 */
export function createAttestation(input: CreateAttestationInput): TwinAttestation {
  const payloadHash = hashEvidencePayload(input.payload);
  const attestation: TwinAttestation = {
    id: nextId("twin-attest"),
    entityType: input.entityType,
    entityId: input.entityId,
    payloadHash,
    attestedBy: input.attestedBy,
    attestedAt: new Date().toISOString(),
    notes: input.notes,
  };
  attestations.push(attestation);
  return attestation;
}

export function hashEvidencePayload(input: Record<string, unknown>): string {
  const normalized = JSON.stringify(input, Object.keys(input).sort());
  return createHash("sha256").update(normalized).digest("hex");
}

const SENSITIVE_KEYS = [
  "emergencyNotes",
  "ownerUserId",
  "contactEmail",
  "ndis",
  "password",
  "health",
  "disability",
];

export function redactSensitiveFields(
  input: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (SENSITIVE_KEYS.some((sk) => key.toLowerCase().includes(sk.toLowerCase()))) {
      out[key] = "[REDACTED]";
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      out[key] = redactSensitiveFields(value as Record<string, unknown>);
    } else {
      out[key] = value;
    }
  }
  return out;
}

export function recordConsentEvent(
  grantId: string,
  eventType: TwinConsentEvent["eventType"],
  actorId?: string
): TwinConsentEvent {
  const event: TwinConsentEvent = {
    id: nextId("twin-consent"),
    grantId,
    eventType,
    timestamp: new Date().toISOString(),
    actorId,
  };
  consentEvents.push(event);
  createAuditEvent({
    eventType: eventType === "revoked" ? "consent_revoked" : "consent_granted",
    entityType: "TwinConsentGrant",
    entityId: grantId,
    actorId,
  });
  return event;
}

export function recordModerationDecision(input: {
  entityType: "evidence" | "issue";
  entityId: string;
  decision: TwinModerationDecision["decision"];
  decidedBy?: string;
  notes?: string;
}): TwinModerationDecision {
  const decision: TwinModerationDecision = {
    id: nextId("twin-mod"),
    entityType: input.entityType,
    entityId: input.entityId,
    decision: input.decision,
    decidedBy: input.decidedBy,
    decidedAt: new Date().toISOString(),
    notes: input.notes,
  };
  moderationDecisions.push(decision);
  createAuditEvent({
    eventType:
      input.decision === "approved" ? "evidence_approved" : "evidence_submitted",
    entityType: input.entityType,
    entityId: input.entityId,
    actorId: input.decidedBy,
    metadata: { decision: input.decision },
  });
  return decision;
}

/** Read-only access for admin dashboard MVP. */
export function getGovernanceSnapshot() {
  return {
    auditEventCount: auditLog.length,
    attestationCount: attestations.length,
    consentEventCount: consentEvents.length,
    moderationDecisionCount: moderationDecisions.length,
    recentAuditEvents: auditLog.slice(-20).reverse(),
  };
}

export function resetGovernanceStoreForTests(): void {
  auditLog.length = 0;
  attestations.length = 0;
  consentEvents.length = 0;
  moderationDecisions.length = 0;
  eventCounter = 0;
}

export function getAuditLog(): readonly TwinAuditEvent[] {
  return auditLog;
}
