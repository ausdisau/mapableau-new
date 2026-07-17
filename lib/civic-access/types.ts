/**
 * MapAble Civic Access Infrastructure — Wave 1 domain types.
 * Civic models environments and public responsibilities — never people scores.
 */

export type CivicMode = "demo" | "shadow" | "pilot" | "production";

export type CivicAssetClass =
  | "transport"
  | "pedestrian_realm"
  | "curb_parking"
  | "buildings_services"
  | "events"
  | "service_infrastructure";

export type CivicAssetType =
  | "stop"
  | "station"
  | "entrance"
  | "platform"
  | "pathway"
  | "lift"
  | "escalator"
  | "boarding_area"
  | "vehicle"
  | "ferry_wharf"
  | "interchange"
  | "community_transport_point"
  | "footpath"
  | "crossing"
  | "refuge_island"
  | "signal"
  | "tactile_indicator"
  | "kerb_ramp"
  | "gradient_segment"
  | "seating"
  | "shelter"
  | "lighting"
  | "construction_zone"
  | "passenger_loading_zone"
  | "accessible_parking"
  | "taxi_rank"
  | "community_transport_bay"
  | "drop_off"
  | "loading_restriction"
  | "event_day_curb"
  | "public_building"
  | "hospital"
  | "clinic"
  | "library"
  | "community_centre"
  | "council_office"
  | "school"
  | "campus"
  | "employment_service"
  | "public_toilet"
  | "changing_places"
  | "emergency_shelter"
  | "cooling_centre"
  | "charging_point"
  | "temporary_entrance"
  | "temporary_path"
  | "viewing_area"
  | "temporary_toilet"
  | "quiet_space"
  | "caption_system"
  | "hearing_augmentation"
  | "event_transport_point"
  | "contact_channel"
  | "booking_workflow"
  | "complaint_workflow"
  | "assistance_point"
  | "navigator_service"
  | "public_information_channel"
  | "other";

export type CivicAssetLifecycle =
  | "draft"
  | "registered"
  | "active"
  | "deprecated"
  | "retired";

export type CivicVisibility = "public" | "internal" | "restricted";

export type CivicClaimState =
  | "unknown"
  | "asserted"
  | "evidenced"
  | "verified"
  | "stale"
  | "disputed"
  | "unavailable";

export type CivicExternalSystem =
  | "access_place"
  | "access_floor_plan"
  | "indoor_feature"
  | "transport_pickup"
  | "transport_dropoff"
  | "transport_vehicle"
  | "gtfs_stop"
  | "gtfs_pathway"
  | "cds_curb_zone"
  | "accessibility_ops_asset"
  | "council_ams"
  | "operator_feed"
  | "other";

export type CivicSourceKind =
  | "mapable_canonical"
  | "partner_feed"
  | "government_open_data"
  | "operator"
  | "venue"
  | "community_mapping"
  | "assessor"
  | "synthetic_pilot"
  | "other";

export type CivicLicenceKind =
  | "cc_by"
  | "cc_by_sa"
  | "cc_by_nc"
  | "open_government"
  | "restricted_operational"
  | "commercial"
  | "community_contributed"
  | "research_extract"
  | "emergency"
  | "internal"
  | "unknown";

export interface CivicGeometry {
  type: "Point" | "LineString" | "Polygon" | "MultiPolygon" | "unknown";
  coordinates?: unknown;
  crs?: string;
  note?: string;
}

export interface CivicAccessibilityClaim {
  claimKey: string;
  label: string;
  state: CivicClaimState;
  evidenceSummary?: string | null;
  sourceDate?: string | null;
  lastVerified?: string | null;
  /** Geometry or import never proves quality — claim stays unknown unless evidenced. */
  notes?: string | null;
}

export interface CivicAssetInput {
  stableKey: string;
  organisationId?: string | null;
  ownerOrganisationId?: string | null;
  operatorOrganisationId?: string | null;
  accessPlaceId?: string | null;
  assetClass: CivicAssetClass;
  assetType: CivicAssetType;
  title: string;
  plainLanguageTitle?: string;
  description?: string;
  jurisdictionCode?: string | null;
  lifecycleState?: CivicAssetLifecycle;
  visibility?: CivicVisibility;
  geometry?: CivicGeometry | null;
  operatingHours?: string | null;
  accessibilityClaims?: CivicAccessibilityClaim[];
  lastVerifiedAt?: Date | null;
  nextReviewAt?: Date | null;
  attribution?: string | null;
  metadata?: Record<string, unknown>;
}

export interface CivicAssetVersionInput {
  versionLabel: string;
  contentHash?: string;
  changelog?: string;
  sourceRevision?: string;
  projectionSnapshot?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface CivicExternalReferenceInput {
  system: CivicExternalSystem;
  externalId: string;
  canonicalRef?: string;
  metadata?: Record<string, unknown>;
}

export interface CivicSourceInput {
  stableKey: string;
  name: string;
  kind: CivicSourceKind;
  organisationId?: string | null;
  publisher?: string | null;
  homepageUrl?: string | null;
  metadata?: Record<string, unknown>;
}

export interface CivicSourceVersionInput {
  versionLabel: string;
  retrievedAt: Date;
  publishedAt?: Date | null;
  contentHash?: string;
  feedUrl?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown>;
}

export interface CivicSourceLicenceInput {
  licenceKind: CivicLicenceKind;
  licenceName: string;
  licenceUrl?: string | null;
  attributionText?: string | null;
  allowsPublicPublication: boolean;
  allowsCommercialReuse: boolean;
  notes?: string | null;
}

export interface StaticAccessibilityProjection {
  assetId: string;
  stableKey: string;
  accessPlaceId: string | null;
  accessPlaceRef: string | null;
  title: string;
  plainLanguageTitle: string | null;
  assetClass: CivicAssetClass;
  assetType: CivicAssetType;
  visibility: CivicVisibility;
  jurisdictionCode: string | null;
  geometryImported: boolean;
  /** Explicit: imported geometry does not prove feature quality. */
  geometryProvesAccessibility: false;
  claims: CivicAccessibilityClaim[];
  unknownClaimCount: number;
  staleClaimCount: number;
  disputedClaimCount: number;
  evidencedClaimCount: number;
  sourceDates: string[];
  lastVerifiedAt: string | null;
  nextReviewAt: string | null;
  externalReferences: Array<{
    system: CivicExternalSystem;
    externalId: string;
    canonicalRef: string | null;
  }>;
  limitations: string[];
  generatedAt: string;
}
