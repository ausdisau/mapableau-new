import { randomUUID } from "node:crypto";

import { captureAiPlatformTelemetry } from "@/lib/ai/platform/telemetry/adapter";
import { adaptiveRecoveryConfig } from "@/lib/config/adaptive-recovery";
import { agenticNerveCentreConfig } from "@/lib/config/agentic-nerve-centre";
import { contextFabricConfig } from "@/lib/config/context-fabric";

import { createDomainEventFromInput, normaliseToContextRecord } from "./normalise";
import { redactPayloadForRevocation } from "./provenance";
import {
  eventRelevantToMission,
  mapDomainEventToMissionEventType,
  mapSourceTrustToEventSource,
  routeDomainEvent,
} from "./routing";
import type { IngestDomainEventInput } from "./schemas";
import { ingestDomainEventInputSchema } from "./schemas";
import {
  getContextRecord,
  isConsentRevoked,
  listContextRecordsForTenant,
  markConsentRevoked,
  saveContextRecord,
  saveDomainEvent,
  updateContextRecord,
} from "./store";
import type {
  EventRouteDecision,
  MapAbleContextRecord,
  MapAbleDomainEvent,
} from "./types";

export type PublishDomainEventResult = {
  event: MapAbleDomainEvent;
  record: MapAbleContextRecord | null;
  duplicate: boolean;
  route: EventRouteDecision;
  recoveryIngested: boolean;
  error: string | null;
};

/**
 * Temporal Event Bus publish path:
 * Domain source → Source Gate → Normaliser → Fabric store → selective routing.
 */
export function publishDomainEvent(
  raw: IngestDomainEventInput,
): PublishDomainEventResult {
  if (!contextFabricConfig.enabled) {
    throw new Error("CONTEXT_FABRIC_DISABLED");
  }
  if (contextFabricConfig.killSwitchActive) {
    throw new Error("CONTEXT_FABRIC_KILL_SWITCH");
  }

  const parsed = ingestDomainEventInputSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`INVALID_DOMAIN_EVENT:${parsed.error.message}`);
  }
  const input = parsed.data;

  const event = createDomainEventFromInput(input);
  const { duplicate } = saveDomainEvent(event);
  if (duplicate) {
    return {
      event,
      record: null,
      duplicate: true,
      route: {
        targets: [],
        reasons: ["duplicate_idempotent"],
        blocked: true,
        blockReason: "duplicate",
      },
      recoveryIngested: false,
      error: null,
    };
  }

  let record: MapAbleContextRecord | null = null;
  let error: string | null = null;

  if (input.eventType === "consent.revoked") {
    applyConsentRevocation(input);
  } else {
    const normalised = normaliseToContextRecord(input);
    if (normalised.error) {
      error = normalised.error;
    } else {
      record = normalised.record;
      // Apply any previously revoked scopes before exposing.
      for (const scope of record.consentScopes) {
        const participantId =
          record.subjectRefs.find((s) => s.kind === "participant")?.id ?? null;
        if (
          participantId &&
          isConsentRevoked(record.tenantId, participantId, scope)
        ) {
          record = redactPayloadForRevocation(record);
          break;
        }
      }
      saveContextRecord(record);
    }
  }

  const route = routeDomainEvent({
    event,
    actorConsentScopes: input.consentScopes,
    routingEnabled: contextFabricConfig.eventRoutingEnabled,
  });

  let recoveryIngested = false;
  if (!error && !route.blocked && route.targets.includes("recovery_engine")) {
    recoveryIngested = tryRouteToRecovery(event);
  }

  if (route.targets.includes("telemetry")) {
    captureAiPlatformTelemetry({
      kind: "context_fabric.domain_event",
      capabilityKey: "context.fabric",
      reason: `${event.eventType}:${event.domain}`,
      tenantScoped: true,
      success: !error,
    });
  }

  return { event, record, duplicate: false, route, recoveryIngested, error };
}

function applyConsentRevocation(input: IngestDomainEventInput): void {
  const participantId =
    input.subjectRefs.find((s) => s.kind === "participant")?.id ??
    (typeof input.payload.participantId === "string"
      ? input.payload.participantId
      : null);
  if (!participantId) return;

  const scopes =
    input.consentScopes.length > 0
      ? input.consentScopes
      : typeof input.payload.scope === "string"
        ? [input.payload.scope]
        : [];

  for (const scope of scopes) {
    markConsentRevoked(input.tenantId, participantId, scope);
  }

  const records = listContextRecordsForTenant(input.tenantId);
  for (const record of records) {
    const linked = record.subjectRefs.some(
      (s) => s.kind === "participant" && s.id === participantId,
    );
    if (!linked) continue;
    const hitsScope = record.consentScopes.some((s) => scopes.includes(s));
    if (!hitsScope && scopes.length > 0) continue;
    updateContextRecord(redactPayloadForRevocation(record));
  }
}

function tryRouteToRecovery(event: MapAbleDomainEvent): boolean {
  if (!adaptiveRecoveryConfig.enabled || !agenticNerveCentreConfig.enabled) {
    return false;
  }
  if (!contextFabricConfig.eventRoutingEnabled) return false;

  const missionEventType = mapDomainEventToMissionEventType(event.eventType);
  if (!missionEventType) return false;

  // Lazy require to avoid circular imports at module load.
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- documented circular-avoidance with recovery planner
  const { ingestMissionEvent } = require("@/lib/ai/platform/recovery/planner") as {
    ingestMissionEvent: (input: {
      missionId: string;
      type: string;
      source: string;
      reportedBy?: string | null;
      systemRecordId?: string | null;
      payload?: Record<string, unknown>;
      idempotencyKey?: string | null;
    }) => { duplicate: boolean };
  };

  let any = false;
  for (const missionId of event.missionIds) {
    if (!eventRelevantToMission(event, missionId)) continue;
    try {
      const source = mapSourceTrustToEventSource(event.sourceTrust);
      ingestMissionEvent({
        missionId,
        type: missionEventType,
        source,
        reportedBy:
          source === "participant_reported"
            ? event.subjectRefs.find((s) => s.kind === "participant")?.id ??
              "participant"
            : null,
        systemRecordId: event.sourceRef,
        payload: {
          fabricEventId: event.eventId,
          domain: event.domain,
          ...event.payload,
        },
        idempotencyKey: event.idempotencyKey
          ? `fabric:${event.idempotencyKey}`
          : `fabric:${event.eventId}`,
      });
      any = true;
    } catch {
      // Recovery may reject provenance — do not fail fabric publish.
    }
  }
  return any;
}

export function getFabricContext(contextId: string): MapAbleContextRecord | null {
  return getContextRecord(contextId);
}

export function createTraceId(): string {
  return randomUUID();
}
