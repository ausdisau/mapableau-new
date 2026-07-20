/** Geometry / definition sources for a provider service area. */
export type ProviderServiceAreaGeometrySource =
  | "postcode_list"
  | "lga_set"
  | "administrative_boundary_set"
  | "radius_from_outlet"
  | "travel_time_approximation"
  | "metropolitan_region"
  | "regional_area"
  | "provider_drawn_polygon"
  | "service_specific_polygon"
  | "worker_availability_area"
  | "accessible_vehicle_coverage_area";

/**
 * Geographic coverage status — never confuse with live availability or capacity.
 */
export type ProviderServiceAreaStatus =
  | "regularly_serviced"
  | "limited_capacity"
  | "by_arrangement"
  | "waitlist"
  | "temporarily_unavailable"
  | "not_serviced"
  | "provider_not_confirmed"
  | "stale";

export type ProviderServiceAreaAvailability =
  | "confirmed"
  | "unknown"
  | "stale";

export type ProviderServiceArea = {
  serviceAreaId: string;
  organisationId: string;
  organisationLabel: string;
  serviceCategory: string;
  geometrySource: ProviderServiceAreaGeometrySource;
  /** Postcodes, LGA codes, or other boundary references. */
  boundaryReferences: string[];
  /** Optional outlet centre for radius definitions (WGS84). */
  outletLatitude?: number;
  outletLongitude?: number;
  radiusKm?: number;
  effectiveDate: string;
  expiresAt?: string;
  status: ProviderServiceAreaStatus;
  /** Live availability is separate from geographic coverage. */
  availability: ProviderServiceAreaAvailability;
  evidence: string[];
  createdBy: string;
  reviewedBy?: string;
  travelFeesMayApply: boolean;
  /** Hard requirements still need checking outside this contract. */
  hardRequirementsNote: string;
};

export type ServiceAreaContainmentResult = {
  covered: boolean;
  status: ProviderServiceAreaStatus;
  availability: ProviderServiceAreaAvailability;
  explanation: string[];
};
