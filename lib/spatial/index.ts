export {
  accessAddressIntelligenceFlags,
  isAccessAddressIntelligenceAvailable,
} from "@/lib/spatial/flags";
export {
  buildAddressResolutionResult,
  confirmAddressResolution,
  isConfirmedAddressResolution,
} from "@/lib/spatial/address-intelligence";
export {
  filterPublishableApproachCandidates,
  listSyntheticCivicApproachCandidates,
  reviewApproachCandidate,
} from "@/lib/spatial/approach-resolver";
export { createGeoscapeSourceReference } from "@/lib/spatial/provenance";
export {
  distanceKm,
  evaluateServiceAreaContainment,
  explainServiceAreaForFinder,
  listSyntheticProviderServiceAreas,
} from "@/lib/spatial/service-areas";
export type {
  AccessApproachCandidate,
  AccessApproachCandidateType,
  AccessApproachReviewDecision,
} from "@/lib/spatial/approach-types";
export type {
  ProviderServiceArea,
  ProviderServiceAreaAvailability,
  ProviderServiceAreaGeometrySource,
  ProviderServiceAreaStatus,
  ServiceAreaContainmentResult,
} from "@/lib/spatial/service-area-types";
export type {
  AddressAmbiguity,
  AddressResolutionResult,
  GeoscapeProduct,
  GeoscapeRequestContext,
  GeoscapeSourceReference,
  SpatialCandidate,
  SpatialCandidateStatus,
  SpatialCandidateType,
  SpatialConfidenceVocabulary,
} from "@/lib/spatial/types";
