export {
  accessAddressIntelligenceFlags,
  isAccessAddressIntelligenceAvailable,
} from "@/lib/spatial/flags";
export {
  buildAddressResolutionResult,
  confirmAddressResolution,
  isConfirmedAddressResolution,
} from "@/lib/spatial/address-intelligence";
export { createGeoscapeSourceReference } from "@/lib/spatial/provenance";
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
