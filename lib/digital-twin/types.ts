/**
 * MapAble Digital Twin domain types.
 *
 * Privacy-sensitive entities:
 * - AccessNeedProfile: disability, health, and support preferences — never expose without consent.
 * - TwinConsentGrant: records who may see which data categories and why.
 * - TwinEvidence with evidenceType "complaint" may contain sensitive user narratives.
 */

export type TwinPlaceType =
  | "venue"
  | "clinic"
  | "workplace"
  | "school"
  | "home"
  | "transport_hub"
  | "park"
  | "event_site"
  | "government_service"
  | "other";

export type TwinPrivacyLevel = "public" | "restricted" | "private";

export type TwinPlaceStatus = "draft" | "published" | "under_review" | "archived";

export type TwinZoneType =
  | "external_path"
  | "entrance"
  | "reception"
  | "corridor"
  | "room"
  | "toilet"
  | "lift"
  | "stairs"
  | "parking"
  | "dropoff"
  | "sensory_space"
  | "service_counter"
  | "seating"
  | "platform"
  | "stop"
  | "other";

export type TwinFeatureType =
  | "parking"
  | "dropoff"
  | "path"
  | "entrance"
  | "doorway"
  | "ramp"
  | "lift"
  | "corridor"
  | "counter"
  | "seating"
  | "toilet"
  | "signage"
  | "hearing"
  | "lighting"
  | "acoustics"
  | "staff_training"
  | "online_info"
  | "emergency"
  | "transport_connection"
  | "other";

export type TwinAvailability =
  | "available"
  | "unavailable"
  | "partial"
  | "unknown"
  | "temporary_unavailable";

export type TwinAccessibilityLevel = "fail" | "bronze" | "silver" | "gold" | "unknown";

export type TwinLightingLevel = "low" | "adequate" | "good" | "unknown";

export type TwinEvidenceType =
  | "assessor_note"
  | "user_review"
  | "photo"
  | "measurement"
  | "venue_declaration"
  | "document"
  | "sensor_status"
  | "complaint"
  | "maintenance_update"
  | "staff_training_record"
  | "imported_dataset";

export type TwinSourceActorType =
  | "user"
  | "assessor"
  | "venue"
  | "provider"
  | "council"
  | "system"
  | "admin";

export type TwinConfidenceLevel = "low" | "medium" | "high";

export type TwinAssessmentMethod =
  | "community"
  | "self_reported"
  | "professional"
  | "imported"
  | "hybrid";

export type TwinAssessmentTier = "none" | "bronze" | "silver" | "gold";

export type TwinIssueType =
  | "access_barrier"
  | "outdated_info"
  | "safety"
  | "privacy"
  | "maintenance"
  | "discrimination"
  | "service_quality"
  | "other";

export type TwinIssueSeverity = "low" | "medium" | "high" | "urgent";

export type TwinIssueStatus =
  | "open"
  | "acknowledged"
  | "in_progress"
  | "resolved"
  | "closed"
  | "pending_review";

export type TwinConsentRecipientType =
  | "provider"
  | "venue"
  | "employer"
  | "transport_operator"
  | "support_coordinator"
  | "family"
  | "council"
  | "admin"
  | "other";

export type GeoPoint = { lat: number; lng: number };

export type GeoJsonLineString = {
  type: "LineString";
  coordinates: [number, number][];
};

export interface TwinPlace {
  id: string;
  name: string;
  slug: string;
  placeType: TwinPlaceType;
  description: string;
  address: string;
  region: string;
  geo: GeoPoint;
  privacy: TwinPrivacyLevel;
  status: TwinPlaceStatus;
  lastVerifiedAt: string;
  confidenceScore: number;
  overallAccessibilityScore: number;
  accessSummaryPlainLanguage: string;
  warnings: string[];
  createdAt: string;
  updatedAt: string;
  /** Marks demo/fictional records. */
  isDemoData?: boolean;
}

export interface TwinZone {
  id: string;
  placeId: string;
  name: string;
  zoneType: TwinZoneType;
  floorLabel?: string;
  order: number;
  notes?: string;
}

export interface TwinFeature {
  id: string;
  placeId: string;
  zoneId?: string;
  featureType: TwinFeatureType;
  name: string;
  description?: string;
  measurements?: Record<string, string | number>;
  availability: TwinAvailability;
  accessibilityLevel: TwinAccessibilityLevel;
  userImpactTags: string[];
  sourceIds: string[];
  lastCheckedAt?: string;
}

export interface TwinPathSegment {
  id: string;
  placeId: string;
  fromZoneId: string;
  toZoneId: string;
  distanceMeters: number;
  widthMm?: number;
  gradientRatio?: number;
  surfaceType?: string;
  hasSteps: boolean;
  hasRamp: boolean;
  hasHandrails: boolean;
  lightingLevel: TwinLightingLevel;
  notes?: string;
  routeGeometry?: GeoJsonLineString;
}

export interface TwinEvidence {
  id: string;
  placeId: string;
  featureId?: string;
  evidenceType: TwinEvidenceType;
  title: string;
  summary: string;
  sourceActorType: TwinSourceActorType;
  sourceActorId?: string;
  capturedAt: string;
  confidence: TwinConfidenceLevel;
  uri?: string;
  metadata?: Record<string, unknown>;
  status?: "pending_review" | "approved" | "rejected";
}

export interface TwinAssessment {
  id: string;
  placeId: string;
  method: TwinAssessmentMethod;
  assessorName?: string;
  assessmentDate: string;
  domains: Record<string, number>;
  totalScore: number;
  tier: TwinAssessmentTier;
  disclaimer: string;
  nextReviewDue?: string;
}

/**
 * Privacy-sensitive: contains disability and support preferences.
 * Must not be persisted or returned without explicit user consent.
 */
export interface AccessNeedProfile {
  id: string;
  ownerUserId: string;
  displayName: string;
  mobilityAids: string[];
  communicationPreferences: string[];
  sensoryPreferences: string[];
  transportNeeds: string[];
  supportPreferences: string[];
  emergencyNotes?: string;
  shareDefault: "private";
  updatedAt: string;
  isDemoData?: boolean;
}

export interface TwinCompatibilityResult {
  placeId: string;
  profileId: string;
  compatibilityScore: number;
  matchedNeeds: string[];
  barriers: string[];
  unknowns: string[];
  recommendedActions: string[];
  confidence: TwinConfidenceLevel;
  explanationPlainLanguage: string;
}

export interface TwinIssue {
  id: string;
  placeId: string;
  featureId?: string;
  issueType: TwinIssueType;
  severity: TwinIssueSeverity;
  status: TwinIssueStatus;
  summary: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Privacy-sensitive: records explicit consent to share access profile data.
 */
export interface TwinConsentGrant {
  id: string;
  ownerUserId: string;
  recipientType: TwinConsentRecipientType;
  recipientId?: string;
  dataCategories: string[];
  purpose: string;
  expiresAt?: string;
  revokedAt?: string;
  createdAt: string;
}

/** Full place bundle for API and UI consumption. */
export interface TwinPlaceBundle {
  place: TwinPlace;
  zones: TwinZone[];
  features: TwinFeature[];
  pathSegments: TwinPathSegment[];
  evidence: TwinEvidence[];
  assessment: TwinAssessment;
  issues: TwinIssue[];
}

/** Manual access need selections for client-side compatibility checks. */
export interface ManualAccessNeeds {
  wheelchairOrMobilityAid?: boolean;
  needsStepFreeEntrance?: boolean;
  needsAccessibleToilet?: boolean;
  needsQuietSpace?: boolean;
  needsHearingSupport?: boolean;
  needsPlainLanguageInfo?: boolean;
  needsAssistanceAnimalReadiness?: boolean;
  needsRampVehicleDropoff?: boolean;
  needsFatigueBuffer?: boolean;
}

/** Governance types (Prompt 11). */
export type TwinAuditEventType =
  | "place_created"
  | "place_published"
  | "feature_updated"
  | "assessment_recalculated"
  | "evidence_submitted"
  | "evidence_approved"
  | "issue_reported"
  | "issue_resolved"
  | "compatibility_checked_no_persist"
  | "consent_granted"
  | "consent_revoked";

export interface TwinAuditEvent {
  id: string;
  eventType: TwinAuditEventType;
  entityType: string;
  entityId: string;
  actorId?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface TwinAttestation {
  id: string;
  entityType: string;
  entityId: string;
  payloadHash: string;
  attestedBy: string;
  attestedAt: string;
  notes?: string;
}

export interface TwinConsentEvent {
  id: string;
  grantId: string;
  eventType: "granted" | "revoked" | "expired";
  timestamp: string;
  actorId?: string;
}

export interface TwinModerationDecision {
  id: string;
  entityType: "evidence" | "issue";
  entityId: string;
  decision: "approved" | "rejected" | "needs_more_info";
  decidedBy?: string;
  decidedAt: string;
  notes?: string;
}
