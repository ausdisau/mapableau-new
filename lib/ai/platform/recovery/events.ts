import { randomUUID } from "node:crypto";

import type { EventSource, MapAbleMissionEvent, MissionEventType } from "./types";
import { TRUSTED_EXTERNAL_SOURCES } from "./types";

const TRUSTED_ASSERTION_TYPES: MissionEventType[] = [
  "TRANSPORT_UNAVAILABLE","WORKER_CANCELLED","PROVIDER_CANCELLED","PRICE_CHANGED","ACTION_FAILED","APPROVAL_EXPIRED",
];

export type IngestEventInput = {
  missionId: string; type: MissionEventType; source: EventSource;
  reportedBy?: string | null; systemRecordId?: string | null;
  verificationState?: MapAbleMissionEvent["provenance"]["verificationState"];
  limitations?: string[]; occurredAt?: string; affectedNodeIds?: string[];
  payload?: Record<string, unknown>; idempotencyKey?: string | null;
};

export function validateEventProvenance(input: IngestEventInput): { valid: boolean; error: string | null } {
  if (TRUSTED_ASSERTION_TYPES.includes(input.type) && input.source === "model_inference") {
    return { valid: false, error: `Event type ${input.type} cannot be asserted by model inference` };
  }
  if (input.source === "verified_external" && !input.systemRecordId) {
    return { valid: false, error: "verified_external events require systemRecordId" };
  }
  if (input.source === "participant_reported" && !input.reportedBy) {
    return { valid: false, error: "participant_reported events require reportedBy" };
  }
  return { valid: true, error: null };
}

export function createMissionEvent(input: IngestEventInput): MapAbleMissionEvent {
  const validation = validateEventProvenance(input);
  if (!validation.valid) throw new Error(validation.error ?? "INVALID_EVENT_PROVENANCE");
  const now = new Date().toISOString();
  return {
    eventId: randomUUID(), missionId: input.missionId, type: input.type, source: input.source,
    provenance: {
      reportedBy: input.reportedBy ?? null, systemRecordId: input.systemRecordId ?? null,
      verificationState: input.verificationState ?? inferVerificationState(input.source),
      limitations: input.limitations ?? [],
    },
    occurredAt: input.occurredAt ?? now, ingestedAt: now,
    affectedNodeIds: input.affectedNodeIds ?? [], payload: input.payload ?? {},
    idempotencyKey: input.idempotencyKey ?? null,
  };
}

function inferVerificationState(source: EventSource): MapAbleMissionEvent["provenance"]["verificationState"] {
  if (TRUSTED_EXTERNAL_SOURCES.includes(source)) return "verified";
  if (source === "participant_reported" || source === "system_derived") return "supported";
  return "uncertain";
}

export function isTrustedEventSource(source: EventSource): boolean {
  return TRUSTED_EXTERNAL_SOURCES.includes(source);
}

export function eventAffectsNodes(event: MapAbleMissionEvent, nodeIds: string[]): boolean {
  if (event.affectedNodeIds.length === 0) return true;
  return event.affectedNodeIds.some((id) => nodeIds.includes(id));
}
