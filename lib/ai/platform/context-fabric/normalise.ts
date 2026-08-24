import { randomUUID } from "node:crypto";

import { evaluateFreshness, verificationForSourceTrust } from "./freshness";
import { INFERENCE_ALLOWED_TYPES } from "./registry";
import type { IngestDomainEventInput } from "./schemas";
import { evaluateSourceGate } from "./sources";
import type {
  ContextType,
  MapAbleContextRecord,
  MapAbleDomainEvent,
} from "./types";

const EVENT_TO_CONTEXT_TYPE: Partial<Record<MapAbleDomainEvent["eventType"], ContextType>> = {
  "access.observation_changed": "access_observation",
  "access.barrier_reported": "access_barrier",
  "care.request_state_changed": "care_request_state",
  "transport.request_state_changed": "transport_request_state",
  "transport.unavailable": "transport_request_state",
  "jobs.event": "job_event",
  "calendar.event_changed": "calendar_event",
  "provider.availability_changed": "provider_availability",
  "worker.availability_changed": "worker_availability",
  "action.result": "action_result",
  "human_review.state_changed": "human_review_state",
  "service.outage": "service_outage",
  "feature.state_changed": "feature_state",
  "goal.changed": "participant_goal",
  "consent.revoked": "feature_state",
  "mission.linked": "mission_state",
  "context.upserted": "mission_state",
};

export type NormaliseInput = IngestDomainEventInput & {
  contextType?: ContextType;
};

/**
 * Context Normaliser — admits gated sources into MapAbleContextRecord.
 * Never strips provenance. Bounded payload only.
 */
export function normaliseToContextRecord(
  input: NormaliseInput,
): { record: MapAbleContextRecord | null; error: string | null } {
  const gate = evaluateSourceGate({
    sourceType: input.sourceType,
    sourceRef: input.sourceRef,
    sourceAuthority: input.sourceAuthority,
    producer: input.producer,
    dataClasses: input.dataClasses,
    consentScopes: input.consentScopes,
    tenantId: input.tenantId,
    authenticated: input.authenticated,
    adapterProvenance: input.adapterProvenance,
  });

  if (!gate.allowed) {
    return { record: null, error: gate.error };
  }

  const contextType =
    input.contextType ??
    EVENT_TO_CONTEXT_TYPE[input.eventType] ??
    "feature_state";

  if (
    input.sourceType === "model_inference" &&
    !INFERENCE_ALLOWED_TYPES.has(contextType)
  ) {
    return {
      record: null,
      error: `model_inference not allowed for context type ${contextType}`,
    };
  }

  const now = new Date().toISOString();
  const observedAt = input.occurredAt ?? now;
  const verificationStatus =
    gate.effectiveVerification ?? verificationForSourceTrust(input.sourceType);

  const record: MapAbleContextRecord = {
    contextId: randomUUID(),
    contextType,
    subjectRefs:
      input.subjectRefs.length > 0
        ? input.subjectRefs
        : [{ kind: "organisation", id: input.tenantId }],
    domain: input.domain,
    tenantId: input.tenantId,
    sourceType: input.sourceType,
    sourceRef: input.sourceRef,
    sourceAuthority: input.sourceAuthority,
    observedAt,
    receivedAt: now,
    freshnessStatus: evaluateFreshness({
      contextType,
      observedAt,
    }),
    verificationStatus,
    evidenceRefs: [...input.evidenceRefs],
    dataClasses: [...input.dataClasses],
    consentScopes: [...input.consentScopes],
    payload: boundPayload(input.payload),
    traceId: input.traceId,
    missionIds: [...input.missionIds],
  };

  return { record, error: null };
}

export function createDomainEventFromInput(
  input: IngestDomainEventInput,
  eventId?: string,
): MapAbleDomainEvent {
  const now = new Date().toISOString();
  return {
    eventId: eventId ?? randomUUID(),
    eventType: input.eventType,
    domain: input.domain,
    aggregateType: input.aggregateType,
    aggregateId: input.aggregateId,
    tenantId: input.tenantId,
    occurredAt: input.occurredAt ?? now,
    receivedAt: now,
    producer: input.producer,
    schemaVersion: input.schemaVersion,
    evidenceRefs: [...input.evidenceRefs],
    dataClasses: [...input.dataClasses],
    consentScopes: [...input.consentScopes],
    subjectRefs: [...input.subjectRefs],
    missionIds: [...input.missionIds],
    payload: boundPayload(input.payload),
    traceId: input.traceId,
    idempotencyKey: input.idempotencyKey ?? null,
    sourceTrust: input.sourceTrust,
    sourceRef: input.sourceRef,
  };
}

/** Cap payload size / keys to prevent unrestricted dumps. */
function boundPayload(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const entries = Object.entries(payload).slice(0, 32);
  const out: Record<string, unknown> = {};
  for (const [k, v] of entries) {
    if (typeof v === "string" && v.length > 4000) {
      out[k] = `${v.slice(0, 4000)}…[truncated]`;
    } else if (Array.isArray(v) && v.length > 50) {
      out[k] = v.slice(0, 50);
    } else {
      out[k] = v;
    }
  }
  return out;
}
