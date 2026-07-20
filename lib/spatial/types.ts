/**
 * Shared spatial-intelligence contracts.
 * Geoscape establishes where places are; MapAble records how they can be used.
 * Inferred candidates must never be presented as confirmed or accessible.
 */

export type GeoscapeProduct =
  | "predictive"
  | "addresses"
  | "buildings"
  | "boundaries"
  | "parcels"
  | "batches"
  | "deltas"
  | "maps";

export type SpatialCandidateType =
  | "address"
  | "building"
  | "property"
  | "parcel"
  | "administrative_area"
  | "approach";

/** Candidate lifecycle — never treat inferred as confirmed. */
export type SpatialCandidateStatus =
  | "inferred"
  | "participant_confirmed"
  | "venue_confirmed"
  | "staff_confirmed"
  | "source_verified"
  | "disputed"
  | "superseded"
  | "rejected"
  | "expired";

export type SpatialConfidenceVocabulary =
  | "high"
  | "medium"
  | "low"
  | "unknown";

export type GeoscapeRequestContext = {
  operation: string;
  tenantId?: string;
  actorId?: string;
  purpose: string;
  requestId: string;
  correlationId?: string;
  timeoutMs?: number;
  allowedDataClasses: Array<
    | "public_spatial_reference"
    | "provider_operational"
    | "participant_personal"
    | "private_home_location"
    | "inferred_spatial_candidate"
  >;
};

export type GeoscapeSourceReference = {
  product: GeoscapeProduct;
  endpoint: string;
  dataset?: string;
  release?: string;
  retrievedAt: string;
  sourceDate?: string;
  attribution: string;
  licenceIdentifier?: string;
};

export type SpatialCandidate = {
  candidateId: string;
  type: SpatialCandidateType;
  label: string;
  /** WGS84 when known — never treat as accessibility proof. */
  latitude?: number;
  longitude?: number;
  source: GeoscapeSourceReference;
  confidence: SpatialConfidenceVocabulary;
  evidence: string[];
  status: SpatialCandidateStatus;
  expiresAt?: string;
};

export type AddressAmbiguity = {
  isAmbiguous: boolean;
  reasons: string[];
  /** Building/property candidates that may need participant confirmation. */
  candidateCount: number;
};

/**
 * Trusted location confirmation result.
 * Does not claim accessibility, entrance usability, or compliance.
 */
export type AddressResolutionResult = {
  formattedAddress: string;
  latitude?: number;
  longitude?: number;
  addressId?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  buildingCandidates: SpatialCandidate[];
  propertyCandidate?: SpatialCandidate;
  parcelCandidate?: SpatialCandidate;
  administrativeAreas: SpatialCandidate[];
  sourceReference: GeoscapeSourceReference;
  ambiguity: AddressAmbiguity;
  /** True until participant (or authorised staff) confirms the location. */
  requiresConfirmation: boolean;
  /** Confirmation state for this resolution — starts inferred. */
  confirmationStatus: Extract<
    SpatialCandidateStatus,
    | "inferred"
    | "participant_confirmed"
    | "staff_confirmed"
    | "rejected"
    | "superseded"
  >;
  /** Explicit non-claims for UI and audits. */
  limitations: string[];
};
