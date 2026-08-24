/**
 * Context Fabric + Temporal Event Bus (Prompt 04) with Agency Memory bridge (Prompt 05).
 */

export type {
  ContextType,
  SourceTrustClass,
  FreshnessStatus,
  VerificationStatus,
  ContextDomain,
  ContextDataClass,
  SubjectRef,
  MapAbleContextRecord,
  DomainEventType,
  EventProducer,
  MapAbleDomainEvent,
  EventRouteTarget,
  EventRouteDecision,
  ContextQueryActor,
  MissionContextQuery,
  MissionContextQueryResult,
  ProvenanceDisplay,
  FreshnessPolicy,
  SourceGateInput,
  SourceGateResult,
} from "./types";

export {
  CONTEXT_TYPES,
  SOURCE_TRUST_CLASSES,
  VERIFIED_TRUST_CLASSES,
  FRESHNESS_STATUSES,
  VERIFICATION_STATUSES,
  CONTEXT_DOMAINS,
  DATA_CLASS_VALUES,
  DOMAIN_EVENT_TYPES,
  EVENT_PRODUCERS,
} from "./types";

export {
  clearContextFabricStore,
  getContextRecord,
  listContextRecordsForTenant,
  saveContextRecord,
  saveDomainEvent,
  getDomainEvent,
  listDomainEvents,
  markConsentRevoked,
  isConsentRevoked,
} from "./store";

export { evaluateFreshness, assertInferenceCannotMasquerade } from "./freshness";
export { evaluateSourceGate } from "./sources";
export { evaluateRecordAuthorisation } from "./scope";
export { routeDomainEvent, mapDomainEventToMissionEventType } from "./routing";
export { publishDomainEvent } from "./events";
export { normaliseToContextRecord } from "./normalise";
export { buildProvenanceDisplay, validateProvenanceIntegrity } from "./provenance";
export { getFreshnessPolicy, INFERENCE_ALLOWED_TYPES } from "./registry";

export {
  agencyMemoryToContextRecords,
  buildAgencyMemoryContextSlice,
} from "./agency-memory";
