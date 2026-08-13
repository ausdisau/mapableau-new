export {
  ACCESS_ASSISTANCE_MODES,
  ACCESS_COMPATIBILITY_STATES,
  ACCESS_CONTEXT_SCOPES,
  ACCESS_CRITICALITIES,
  ACCESS_DISCLOSURE_SCOPES,
  ACCESS_DOMAIN_LABELS,
  ACCESS_DOMAINS,
  ACCESS_ENTITY_TYPES,
  ACCESS_JOURNEY_SEGMENT_KINDS,
  ACCESS_PROVENANCE_STATUSES,
  ACCESS_TIMINGS,
  ONTOLOGY_DOMAINS_V1,
  V1_DOMAIN_TO_ACCESS_DOMAIN,
} from "./domains";
export type {
  AccessAssistanceMode,
  AccessCompatibilityState,
  AccessContextScope,
  AccessCriticality,
  AccessDisclosureScope,
  AccessDomain,
  AccessEntityType,
  AccessJourneySegmentKind,
  AccessProvenanceStatus,
  AccessTiming,
  OntologyDomainV1,
} from "./domains";

export type {
  AccessAdjustment,
  AccessCapability,
  AccessCompatibility,
  AccessJourney,
  AccessJourneySegment,
  AccessObservation,
  AccessPassport,
  AccessRequirement,
} from "./types";

export { isDecisiveCompatibility, mapConclusionToCompatibility } from "./compatibility";
export {
  evaluateCompatibility,
  toCompatibilityApiResponse,
} from "./compatibility-engine";
export type {
  CompatibilityEngineInput,
  CompatibilityEngineResult,
  RequirementNeedResult,
} from "./compatibility-engine";
export {
  evaluateEntityCompatibility,
  evaluatePlaceCompatibilityForUser,
} from "./compatibility-service";
export {
  listEntityCapabilities,
  listPlaceCapabilities,
  PLACE_FEATURE_TO_ONTOLOGY,
} from "./capabilities-service";
export { accessInfrastructureFlags } from "./flags";
export {
  getAccessPassportForUser,
  getOrCreateAccessPassport,
  patchAccessPassport,
  toPassportApiResponse,
} from "./passport-service";
export type { PassportPatchInput, PassportRequirementInput } from "./passport-service";
export { ensureAaIDemoPlace, AAI_DEMO_PLACE_NAME } from "./demo-place-seed";
export {
  COMMON_ACCESS_CONCEPTS,
  COMPATIBILITY_STATUS_DETAIL,
  COMPATIBILITY_STATUS_WORDS,
  CRITICALITY_LABELS,
  DISCLOSURE_SCOPE_LABELS,
  FIRST_RUN_CONCEPT_IDS,
  PLACE_COMPAT_PRIVACY_CTA,
  VISIBILITY_LABELS,
  labelForConceptId,
} from "./ui-copy";
export type {
  CommonAccessConcept,
  PassportVisibilityDefault,
} from "./ui-copy";
