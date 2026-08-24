/**
 * Context Fabric types — provenance-aware operational context (perception layer).
 * Bounded context types only; no diagnostic/psychological inferred-state.
 */

export const CONTEXT_TYPES = [
  "participant_declared_preference",
  "participant_goal",
  "mission_state",
  "care_request_state",
  "transport_request_state",
  "access_observation",
  "access_barrier",
  "venue_feature",
  "job_event",
  "workplace_requirement",
  "provider_availability",
  "worker_availability",
  "appointment",
  "calendar_event",
  "action_result",
  "human_review_state",
  "service_outage",
  "feature_state",
] as const;
export type ContextType = (typeof CONTEXT_TYPES)[number];

/** Source trust — model inference MUST NEVER impersonate verified evidence. */
export const SOURCE_TRUST_CLASSES = [
  "participant_declared",
  "verified_system_record",
  "authenticated_provider_record",
  "human_operator_record",
  "public_authoritative_source",
  "community_observation",
  "model_inference",
] as const;
export type SourceTrustClass = (typeof SOURCE_TRUST_CLASSES)[number];

export const VERIFIED_TRUST_CLASSES: SourceTrustClass[] = [
  "verified_system_record",
  "authenticated_provider_record",
  "public_authoritative_source",
];

export const FRESHNESS_STATUSES = [
  "current",
  "aging",
  "stale",
  "expired",
  "unknown",
] as const;
export type FreshnessStatus = (typeof FRESHNESS_STATUSES)[number];

export const VERIFICATION_STATUSES = [
  "verified",
  "supported",
  "partial",
  "uncertain",
  "inference_only",
  "unknown",
] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const CONTEXT_DOMAINS = [
  "access",
  "care",
  "transport",
  "jobs",
  "calendar",
  "mission",
  "recovery",
  "actions",
  "platform",
  "audit",
] as const;
export type ContextDomain = (typeof CONTEXT_DOMAINS)[number];

export const DATA_CLASS_VALUES = [
  "public",
  "operational",
  "participant_pii",
  "health_sensitive",
  "financial",
  "safeguarding",
  "credentials_secrets",
  "legal_privileged",
] as const;
export type ContextDataClass = (typeof DATA_CLASS_VALUES)[number];

export type SubjectRef = {
  kind: "participant" | "mission" | "provider" | "worker" | "venue" | "job" | "organisation";
  id: string;
};

/**
 * Canonical provenance-aware context record.
 * Provenance fields must never be stripped.
 */
export type MapAbleContextRecord = {
  contextId: string;
  contextType: ContextType;
  subjectRefs: SubjectRef[];
  domain: ContextDomain;
  tenantId: string;
  sourceType: SourceTrustClass;
  sourceRef: string;
  sourceAuthority: string;
  observedAt: string;
  effectiveFrom?: string;
  effectiveUntil?: string;
  receivedAt: string;
  freshnessStatus: FreshnessStatus;
  verificationStatus: VerificationStatus;
  evidenceRefs: string[];
  dataClasses: ContextDataClass[];
  consentScopes: string[];
  /** Bounded operational payload — never a complete participant profile dump. */
  payload: Record<string, unknown>;
  traceId: string;
  /** Soft-revocation marker — record retained for audit, excluded from model queries. */
  consentRevokedAt?: string | null;
  missionIds?: string[];
};

export const DOMAIN_EVENT_TYPES = [
  "context.upserted",
  "context.revoked",
  "context.stale_marked",
  "mission.linked",
  "access.observation_changed",
  "access.barrier_reported",
  "care.request_state_changed",
  "transport.request_state_changed",
  "transport.unavailable",
  "jobs.event",
  "calendar.event_changed",
  "provider.availability_changed",
  "worker.availability_changed",
  "action.result",
  "human_review.state_changed",
  "service.outage",
  "feature.state_changed",
  "consent.revoked",
  "goal.changed",
] as const;
export type DomainEventType = (typeof DOMAIN_EVENT_TYPES)[number];

export const EVENT_PRODUCERS = [
  "authenticated_internal",
  "external_adapter",
  "participant",
  "human_operator",
  "system_derived",
  "model_assist",
] as const;
export type EventProducer = (typeof EVENT_PRODUCERS)[number];

/**
 * Temporal Event Bus envelope — typed, versioned, idempotent, provenance-aware.
 * Not a replacement for MapAbleMissionEvent; feeds selective routing into recovery.
 */
export type MapAbleDomainEvent = {
  eventId: string;
  eventType: DomainEventType;
  domain: ContextDomain;
  aggregateType: string;
  aggregateId: string;
  tenantId: string;
  occurredAt: string;
  receivedAt: string;
  producer: EventProducer;
  schemaVersion: number;
  evidenceRefs: string[];
  dataClasses: ContextDataClass[];
  consentScopes: string[];
  subjectRefs: SubjectRef[];
  missionIds: string[];
  /** Bounded typed payload — no unrestricted arbitrary dumps. */
  payload: Record<string, unknown>;
  traceId: string;
  idempotencyKey: string | null;
  sourceTrust: SourceTrustClass;
  sourceRef: string;
};

export type EventRouteTarget =
  | "mission_runtime"
  | "recovery_engine"
  | "audit"
  | "telemetry";

export type EventRouteDecision = {
  targets: EventRouteTarget[];
  reasons: string[];
  blocked: boolean;
  blockReason: string | null;
};

export type ContextQueryActor = {
  actorId: string;
  role: "participant" | "support_coordinator" | "admin" | "system";
  tenantId: string;
};

export type MissionContextQuery = {
  missionId: string;
  participantId: string;
  tenantId: string;
  requestedContextTypes?: ContextType[];
  consentScopes: string[];
  actor: ContextQueryActor;
};

export type MissionContextQueryResult = {
  records: MapAbleContextRecord[];
  excludedCount: number;
  exclusionReasons: string[];
  unknownTypes: ContextType[];
  missingTypes: ContextType[];
  queriedAt: string;
  fabricEnabled: boolean;
};

export type ProvenanceDisplay = {
  sourceLabel: string;
  observedAt: string;
  verificationState: VerificationStatus;
  freshnessStatus: FreshnessStatus;
  whyUsed: string;
  correctionRoute: string;
  accessibleSummary: string;
};

export type FreshnessPolicy = {
  contextType: ContextType;
  currentMaxHours: number;
  agingMaxHours: number;
  staleMaxHours: number;
  /** null = no hard expiry (unknown age stays unknown, not missing) */
  expireAfterHours: number | null;
};

export type SourceGateInput = {
  sourceType: SourceTrustClass;
  sourceRef: string;
  sourceAuthority: string;
  producer: EventProducer;
  dataClasses: ContextDataClass[];
  consentScopes: string[];
  tenantId: string;
  authenticated: boolean;
  adapterProvenance?: string | null;
};

export type SourceGateResult = {
  allowed: boolean;
  error: string | null;
  effectiveVerification: VerificationStatus;
};
