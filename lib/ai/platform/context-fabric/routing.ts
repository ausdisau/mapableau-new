import type {
  EventRouteDecision,
  EventRouteTarget,
  MapAbleDomainEvent,
} from "./types";
import { RECOVERY_RELEVANT_EVENT_TYPES } from "./registry";
import { scopesOverlap } from "./scope";

/**
 * Deterministic selective event routing.
 * Do NOT send every event to every agent.
 */
export function routeDomainEvent(input: {
  event: MapAbleDomainEvent;
  actorConsentScopes?: string[];
  routingEnabled: boolean;
}): EventRouteDecision {
  if (!input.routingEnabled) {
    return {
      targets: [],
      reasons: ["event_routing_disabled"],
      blocked: true,
      blockReason: "MAPABLE_CONTEXT_EVENT_ROUTING_ENABLED=false",
    };
  }

  const event = input.event;
  const targets: EventRouteTarget[] = [];
  const reasons: string[] = [];

  targets.push("audit");
  reasons.push("domain_event_audit");

  targets.push("telemetry");
  reasons.push("domain_event_telemetry");

  const consentOk = scopesOverlap(
    event.consentScopes,
    input.actorConsentScopes ?? event.consentScopes,
  );
  if (!consentOk) {
    return {
      targets: ["audit"],
      reasons: ["consent_filter_blocked_downstream"],
      blocked: true,
      blockReason: "consent_scopes_not_satisfied",
    };
  }

  if (event.dataClasses.includes("credentials_secrets")) {
    return {
      targets: ["audit"],
      reasons: ["credentials_blocked"],
      blocked: true,
      blockReason: "credentials_secrets_not_routable",
    };
  }

  const missionLinked = event.missionIds.length > 0;
  if (missionLinked) {
    targets.push("mission_runtime");
    reasons.push("mission_linkage");
  }

  if (
    missionLinked &&
    RECOVERY_RELEVANT_EVENT_TYPES.has(event.eventType) &&
    event.sourceTrust !== "model_inference"
  ) {
    targets.push("recovery_engine");
    reasons.push("recovery_relevant_mission_event");
  }

  if (event.sourceTrust === "model_inference" && targets.includes("recovery_engine")) {
    const filtered = targets.filter((t) => t !== "recovery_engine");
    return {
      targets: filtered,
      reasons: [...reasons, "model_inference_excluded_from_recovery"],
      blocked: false,
      blockReason: null,
    };
  }

  return {
    targets: dedupe(targets),
    reasons,
    blocked: false,
    blockReason: null,
  };
}

export function eventRelevantToMission(
  event: MapAbleDomainEvent,
  missionId: string,
): boolean {
  if (event.missionIds.includes(missionId)) return true;
  return event.subjectRefs.some(
    (s) => s.kind === "mission" && s.id === missionId,
  );
}

function dedupe<T>(items: T[]): T[] {
  return [...new Set(items)];
}

/** Map fabric domain events onto recovery MissionEventType when routing. */
export function mapDomainEventToMissionEventType(
  eventType: MapAbleDomainEvent["eventType"],
):
  | "TRANSPORT_UNAVAILABLE"
  | "WORKER_CANCELLED"
  | "VENUE_ACCESS_CHANGED"
  | "PROVIDER_CANCELLED"
  | "CONSENT_REVOKED"
  | "ACTION_FAILED"
  | "PARTICIPANT_CHANGED_GOAL"
  | "EVIDENCE_STALE"
  | "SAFEGUARDING_SIGNAL"
  | null {
  switch (eventType) {
    case "transport.unavailable":
      return "TRANSPORT_UNAVAILABLE";
    case "worker.availability_changed":
      return "WORKER_CANCELLED";
    case "access.observation_changed":
    case "access.barrier_reported":
      return "VENUE_ACCESS_CHANGED";
    case "provider.availability_changed":
      return "PROVIDER_CANCELLED";
    case "consent.revoked":
      return "CONSENT_REVOKED";
    case "action.result":
      return "ACTION_FAILED";
    case "goal.changed":
      return "PARTICIPANT_CHANGED_GOAL";
    case "context.stale_marked":
      return "EVIDENCE_STALE";
    case "human_review.state_changed":
      return "SAFEGUARDING_SIGNAL";
    case "care.request_state_changed":
    case "transport.request_state_changed":
    case "jobs.event":
    case "calendar.event_changed":
    case "service.outage":
    case "feature.state_changed":
    case "context.upserted":
    case "context.revoked":
    case "mission.linked":
      return null;
    default: {
      const _exhaustive: never = eventType;
      return _exhaustive;
    }
  }
}

export function mapSourceTrustToEventSource(
  trust: MapAbleDomainEvent["sourceTrust"],
): "participant_reported" | "authenticated_internal" | "verified_external" | "model_inference" | "system_derived" {
  switch (trust) {
    case "participant_declared":
    case "community_observation":
      return "participant_reported";
    case "verified_system_record":
    case "public_authoritative_source":
      return "verified_external";
    case "authenticated_provider_record":
    case "human_operator_record":
      return "authenticated_internal";
    case "model_inference":
      return "model_inference";
    default: {
      const _exhaustive: never = trust;
      return _exhaustive;
    }
  }
}
