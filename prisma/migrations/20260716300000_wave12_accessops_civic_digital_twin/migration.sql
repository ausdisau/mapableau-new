-- MapAble Wave 12: AccessOps Civic Infrastructure Digital Twin.
-- Forward-only. Additive enums/models only. Does not weaken Waves 2–11.
-- Does NOT create a parallel accessibility map — overlays AccessPlace /
-- AccessFloorPlan / IndoorAccessibilityIncident.
-- Hard rules encoded in application services:
--   * unknown/stale ≠ accessible
--   * no fabricated owners or uptime
--   * no physical actuation
--   * accreditation ≠ live operational status
--   * external feeds / outdoor routing / open-data publish DISABLED by default
--   * community reports are allegations until validated
--   * work-order completion does not auto-restore status

-- CreateEnum
CREATE TYPE "AccessAssetType" AS ENUM ('venue', 'building', 'entrance', 'floor', 'room', 'corridor', 'path', 'footpath', 'crossing', 'kerb_ramp', 'drop_off_zone', 'parking_space', 'transit_stop', 'station', 'platform', 'lift', 'escalator', 'ramp', 'stair', 'door', 'gate', 'toilet', 'changing_place', 'service_counter', 'quiet_space', 'hearing_loop', 'tactile_feature', 'wayfinding_sign', 'checkpoint', 'vehicle', 'route_segment', 'equipment', 'sensor', 'other');
-- CreateEnum
CREATE TYPE "AccessOpsFeatureType" AS ENUM ('step_free_access', 'wheelchair_access', 'mobility_device_access', 'level_entry', 'ramp_access', 'lift_access', 'automatic_door', 'door_clearance', 'corridor_clearance', 'turning_space', 'accessible_toilet', 'changing_place', 'accessible_parking', 'accessible_drop_off', 'accessible_boarding', 'tactile_guidance', 'braille_signage', 'hearing_loop', 'captioning', 'quiet_space', 'sensory_support', 'visual_alarm', 'audio_guidance', 'staff_assistance', 'assistance_animal_access', 'accessible_service_counter', 'seating', 'rest_point', 'lighting', 'surface_quality', 'gradient', 'crossfall', 'kerb_height', 'other');
-- CreateEnum
CREATE TYPE "AccessOperationalState" AS ENUM ('unknown', 'reported_available', 'verified_available', 'degraded', 'partially_available', 'temporarily_unavailable', 'scheduled_unavailable', 'under_maintenance', 'permanently_removed', 'status_conflict', 'stale', 'test_only');
-- CreateEnum
CREATE TYPE "AccessEvidenceLevel" AS ENUM ('self_reported', 'community_observed', 'operator_reported', 'document_supported', 'sensor_observed', 'assessor_verified', 'independently_verified', 'authoritative_source', 'disputed', 'unknown');
-- CreateEnum
CREATE TYPE "AccessAssetLifecycleStatus" AS ENUM ('proposed', 'mapped', 'awaiting_owner', 'awaiting_verification', 'active', 'degraded', 'maintenance', 'suspended', 'retired', 'removed', 'archived');
-- CreateEnum
CREATE TYPE "AccessPublicVisibility" AS ENUM ('public', 'authenticated', 'restricted', 'staff_only', 'never_public');
-- CreateEnum
CREATE TYPE "AccessSecurityClassification" AS ENUM ('public', 'internal', 'restricted', 'security_sensitive');
-- CreateEnum
CREATE TYPE "AccessObservationMethod" AS ENUM ('manual_measurement', 'professional_assessment', 'operator_declaration', 'community_report', 'sensor', 'document_import', 'structured_feed', 'MapAble_import', 'inferred_from_geometry', 'unknown');
-- CreateEnum
CREATE TYPE "AccessVerificationStatus" AS ENUM ('unverified', 'pending_review', 'verified', 'rejected', 'superseded');
-- CreateEnum
CREATE TYPE "AccessDisputeStatus" AS ENUM ('none', 'open', 'under_review', 'upheld', 'withdrawn');
-- CreateEnum
CREATE TYPE "AccessTwinEdgeType" AS ENUM ('contains', 'located_within', 'connects_to', 'accessible_via', 'alternative_to', 'required_for', 'depends_on', 'powered_by', 'monitored_by', 'operated_by', 'maintained_by', 'owned_by', 'blocks', 'bypasses', 'serves', 'enters', 'exits', 'transfers_to', 'adjacent_to', 'replacement_for', 'supersedes');
-- CreateEnum
CREATE TYPE "AccessEdgeDirection" AS ENUM ('directed', 'undirected');
-- CreateEnum
CREATE TYPE "AccessDependencyCriticality" AS ENUM ('optional', 'preferred', 'required', 'blocking');
-- CreateEnum
CREATE TYPE "AccessStatusReasonCode" AS ENUM ('normal_operation', 'planned_maintenance', 'unplanned_failure', 'vandalism', 'weather', 'power_failure', 'network_failure', 'construction', 'staffing', 'obstruction', 'cleanliness', 'safety_issue', 'sensor_fault', 'inspection', 'community_report', 'data_conflict', 'unknown');
-- CreateEnum
CREATE TYPE "AccessStatusSourceType" AS ENUM ('operator', 'sensor', 'community', 'assessor', 'system_projection', 'import_feed', 'test');
-- CreateEnum
CREATE TYPE "AccessDataSourceType" AS ENUM ('government_open_data', 'transport_operator', 'venue_operator', 'building_operator', 'council', 'private_partner', 'community', 'assessor', 'sensor_gateway', 'MapAble', 'manual', 'test');
-- CreateEnum
CREATE TYPE "AccessDataSourceStatus" AS ENUM ('proposed', 'approved', 'active', 'suspended', 'retired', 'disabled');
-- CreateEnum
CREATE TYPE "AccessSourceTrustLevel" AS ENUM ('untrusted', 'low', 'medium', 'high', 'authoritative_domain_specific');
-- CreateEnum
CREATE TYPE "AccessConformanceStatus" AS ENUM ('unknown', 'not_checked', 'partial', 'conformant', 'non_conformant');
-- CreateEnum
CREATE TYPE "CivicAccessEntityType" AS ENUM ('venue_owner', 'venue_operator', 'asset_owner', 'asset_operator', 'maintainer', 'transport_agency', 'council', 'government_department', 'contractor', 'accreditation_body', 'community_organisation', 'MapAble', 'unknown');
-- CreateEnum
CREATE TYPE "CivicAccessEntityStatus" AS ENUM ('active', 'inactive', 'disputed', 'archived');
-- CreateEnum
CREATE TYPE "AccessResponsibilityType" AS ENUM ('ownership', 'operation', 'maintenance', 'inspection', 'status_reporting', 'incident_response', 'public_communication', 'data_stewardship');
-- CreateEnum
CREATE TYPE "AccessResponsibilityStatus" AS ENUM ('asserted', 'verified', 'disputed', 'ended');
-- CreateEnum
CREATE TYPE "AccessIncidentCategory" AS ENUM ('asset_failure', 'lift_failure', 'door_failure', 'toilet_unavailable', 'changing_place_unavailable', 'kerb_obstruction', 'parking_misuse', 'route_obstruction', 'construction_barrier', 'signage_failure', 'sensory_access_failure', 'hearing_loop_failure', 'information_failure', 'staff_access_failure', 'transit_access_failure', 'digital_access_failure', 'sensor_failure', 'data_integrity', 'other');
-- CreateEnum
CREATE TYPE "AccessIncidentState" AS ENUM ('reported', 'validating', 'acknowledged', 'impact_assessing', 'owner_notified', 'response_planned', 'remediation_active', 'monitoring', 'restored_pending_verification', 'restored', 'disputed', 'closed', 'archived');
-- CreateEnum
CREATE TYPE "AccessWorkOrderType" AS ENUM ('inspection', 'cleaning', 'obstruction_removal', 'repair', 'replacement', 'software_update', 'signage', 'temporary_access_measure', 'preventive_maintenance', 'data_correction', 'sensor_service', 'other');
-- CreateEnum
CREATE TYPE "AccessWorkOrderPriority" AS ENUM ('low', 'medium', 'high', 'urgent');
-- CreateEnum
CREATE TYPE "AccessWorkOrderStatus" AS ENUM ('requested', 'acknowledged', 'scheduled', 'in_progress', 'completed_pending_verification', 'verified', 'cancelled', 'overdue');
-- CreateEnum
CREATE TYPE "AccessCommunityReportKind" AS ENUM ('working', 'not_working', 'blocked', 'difficult_to_use', 'information_incorrect', 'temporary_change', 'staff_assistance_unavailable', 'accessible_toilet_unavailable', 'lift_unavailable', 'drop_off_blocked', 'route_inaccessible', 'sensory_condition_changed', 'other');
-- CreateEnum
CREATE TYPE "AccessCommunityReportStatus" AS ENUM ('submitted', 'provisional_status_applied', 'under_moderation', 'validated', 'disputed', 'withdrawn', 'closed');
-- CreateEnum
CREATE TYPE "AccessSensorDeviceType" AS ENUM ('lift_state', 'door_state', 'obstruction', 'parking_occupancy', 'drop_off_occupancy', 'environmental', 'equipment_health', 'connectivity', 'other');
-- CreateEnum
CREATE TYPE "AccessSensorHealthStatus" AS ENUM ('healthy', 'degraded', 'unknown', 'offline', 'suspended', 'compromised');
-- CreateEnum
CREATE TYPE "AccessSensorTrustStatus" AS ENUM ('untrusted', 'provisional', 'trusted', 'revoked');
-- CreateEnum
CREATE TYPE "AccessSensorCalibrationStatus" AS ENUM ('unknown', 'calibrated', 'due', 'overdue', 'not_applicable');
-- CreateEnum
CREATE TYPE "AccessCurbZoneType" AS ENUM ('accessible_drop_off', 'accessible_pick_up', 'wheelchair_taxi', 'community_transport', 'accessible_parking', 'loading', 'passenger', 'temporary_access_zone');
-- CreateEnum
CREATE TYPE "AccessJourneyPlanStatus" AS ENUM ('draft', 'generated', 'selected', 'monitoring', 'expired', 'superseded', 'cancelled');
-- CreateEnum
CREATE TYPE "AccessFitResult" AS ENUM ('compatible', 'incompatible', 'uncertain', 'requires_confirmation', 'insufficient_data');
-- CreateEnum
CREATE TYPE "AccessGraphPublicationStatus" AS ENUM ('draft', 'in_review', 'published', 'superseded', 'rejected', 'test_only');
-- CreateEnum
CREATE TYPE "AccessWebhookDeliveryStatus" AS ENUM ('queued', 'delivering', 'delivered', 'failed', 'dead_letter', 'cancelled');
-- CreateEnum
CREATE TYPE "AccessOpsAssuranceOutcome" AS ENUM ('pass', 'fail', 'conditional', 'not_assessed');
-- CreateTable
CREATE TABLE "accessops_assets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "public_identifier" TEXT NOT NULL,
    "asset_type" "AccessAssetType" NOT NULL,
    "parent_asset_id" TEXT,
    "place_id" TEXT,
    "venue_id" TEXT,
    "floor_plan_id" TEXT,
    "geometry_reference" TEXT,
    "geometry_type" TEXT,
    "geometry_version" INTEGER NOT NULL DEFAULT 1,
    "indoor_level" TEXT,
    "title" TEXT NOT NULL,
    "plain_language_description" TEXT,
    "owner_entity_id" TEXT,
    "operator_entity_id" TEXT,
    "maintainer_entity_id" TEXT,
    "jurisdiction" TEXT NOT NULL DEFAULT 'AU',
    "lifecycle_status" "AccessAssetLifecycleStatus" NOT NULL DEFAULT 'proposed',
    "public_visibility" "AccessPublicVisibility" NOT NULL DEFAULT 'public',
    "security_classification" "AccessSecurityClassification" NOT NULL DEFAULT 'public',
    "source_system" TEXT NOT NULL,
    "source_reference" TEXT,
    "data_source_id" TEXT,
    "data_licence" TEXT,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "accessops_assets_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "accessops_assets_public_identifier_key" ON "accessops_assets"("public_identifier");
CREATE INDEX "accessops_assets_tenant_id_lifecycle_status_idx" ON "accessops_assets"("tenant_id", "lifecycle_status");
CREATE INDEX "accessops_assets_place_id_idx" ON "accessops_assets"("place_id");
CREATE INDEX "accessops_assets_asset_type_lifecycle_status_idx" ON "accessops_assets"("asset_type", "lifecycle_status");
CREATE INDEX "accessops_assets_owner_entity_id_idx" ON "accessops_assets"("owner_entity_id");
CREATE INDEX "accessops_assets_security_classification_public_visibility_idx" ON "accessops_assets"("security_classification", "public_visibility");
-- CreateTable
CREATE TABLE "accessops_feature_observations" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "feature_type" "AccessOpsFeatureType" NOT NULL,
    "observed_value" JSONB NOT NULL,
    "unit" TEXT,
    "evidence_level" "AccessEvidenceLevel" NOT NULL DEFAULT 'unknown',
    "source_type" TEXT NOT NULL,
    "source_entity_id" TEXT,
    "source_reference" TEXT,
    "observation_method" "AccessObservationMethod" NOT NULL DEFAULT 'unknown',
    "observed_at" TIMESTAMP(3) NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_until" TIMESTAMP(3),
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "verification_status" "AccessVerificationStatus" NOT NULL DEFAULT 'unverified',
    "dispute_status" "AccessDisputeStatus" NOT NULL DEFAULT 'none',
    "safe_notes" TEXT,
    "private_evidence_reference" TEXT,
    "schema_version" INTEGER NOT NULL DEFAULT 1,
    "is_inferred" BOOLEAN NOT NULL DEFAULT FALSE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "accessops_feature_observations_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "accessops_feature_observations_asset_id_feature_type_observed_at_idx" ON "accessops_feature_observations"("asset_id", "feature_type", "observed_at");
CREATE INDEX "accessops_feature_observations_verification_status_dispute_status_idx" ON "accessops_feature_observations"("verification_status", "dispute_status");
-- CreateTable
CREATE TABLE "accessops_twin_edges" (
    "id" TEXT NOT NULL,
    "from_asset_id" TEXT NOT NULL,
    "to_asset_id" TEXT NOT NULL,
    "edge_type" "AccessTwinEdgeType" NOT NULL,
    "direction" "AccessEdgeDirection" NOT NULL DEFAULT 'directed',
    "conditions" JSONB,
    "accessibility_constraints" JSONB,
    "minimum_clearance" DOUBLE PRECISION,
    "maximum_gradient" DOUBLE PRECISION,
    "time_restriction" JSONB,
    "dependency_criticality" "AccessDependencyCriticality" NOT NULL DEFAULT 'optional',
    "source_reference" TEXT NOT NULL,
    "evidence_level" "AccessEvidenceLevel" NOT NULL DEFAULT 'unknown',
    "security_classification" "AccessSecurityClassification" NOT NULL DEFAULT 'public',
    "valid_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_until" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "superseded_at" TIMESTAMP(3),
    CONSTRAINT "accessops_twin_edges_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "accessops_twin_edges_from_asset_id_edge_type_idx" ON "accessops_twin_edges"("from_asset_id", "edge_type");
CREATE INDEX "accessops_twin_edges_to_asset_id_edge_type_idx" ON "accessops_twin_edges"("to_asset_id", "edge_type");
CREATE INDEX "accessops_twin_edges_version_superseded_at_idx" ON "accessops_twin_edges"("version", "superseded_at");
-- CreateTable
CREATE TABLE "accessops_status_events" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "state" "AccessOperationalState" NOT NULL,
    "previous_state" "AccessOperationalState",
    "source_type" "AccessStatusSourceType" NOT NULL,
    "source_entity_id" TEXT,
    "source_reference" TEXT,
    "evidence_level" "AccessEvidenceLevel" NOT NULL DEFAULT 'unknown',
    "reason_code" "AccessStatusReasonCode" NOT NULL DEFAULT 'unknown',
    "safe_description" TEXT NOT NULL,
    "observed_at" TIMESTAMP(3) NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "expected_until" TIMESTAMP(3),
    "actual_until" TIMESTAMP(3),
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "freshness_window_seconds" INTEGER NOT NULL DEFAULT 86400,
    "correlation_id" TEXT NOT NULL,
    "external_event_id" TEXT,
    "verification_status" "AccessVerificationStatus" NOT NULL DEFAULT 'unverified',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "accessops_status_events_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "accessops_status_events_asset_id_external_event_id_key" ON "accessops_status_events"("asset_id", "external_event_id");
CREATE INDEX "accessops_status_events_asset_id_effective_from_idx" ON "accessops_status_events"("asset_id", "effective_from");
CREATE INDEX "accessops_status_events_state_effective_from_idx" ON "accessops_status_events"("state", "effective_from");
CREATE INDEX "accessops_status_events_correlation_id_idx" ON "accessops_status_events"("correlation_id");
-- CreateTable
CREATE TABLE "accessops_data_sources" (
    "id" TEXT NOT NULL,
    "source_key" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "owner_entity_id" TEXT NOT NULL,
    "source_type" "AccessDataSourceType" NOT NULL,
    "protocol" TEXT NOT NULL,
    "endpoint_reference" TEXT,
    "jurisdiction" TEXT NOT NULL DEFAULT 'AU',
    "data_licence" TEXT NOT NULL,
    "allowed_uses" JSONB NOT NULL,
    "attribution_text" TEXT NOT NULL,
    "trust_level" "AccessSourceTrustLevel" NOT NULL DEFAULT 'untrusted',
    "expected_update_interval_seconds" INTEGER NOT NULL,
    "stale_after_seconds" INTEGER NOT NULL,
    "schema_profile" TEXT NOT NULL,
    "conformance_status" "AccessConformanceStatus" NOT NULL DEFAULT 'not_checked',
    "security_review_id" TEXT,
    "privacy_review_id" TEXT,
    "accessibility_review_id" TEXT,
    "status" "AccessDataSourceStatus" NOT NULL DEFAULT 'proposed',
    "production_activated" BOOLEAN NOT NULL DEFAULT FALSE,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "accessops_data_sources_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "accessops_data_sources_source_key_key" ON "accessops_data_sources"("source_key");
CREATE INDEX "accessops_data_sources_status_production_activated_idx" ON "accessops_data_sources"("status", "production_activated");
-- CreateTable
CREATE TABLE "accessops_civic_entities" (
    "id" TEXT NOT NULL,
    "entity_type" "CivicAccessEntityType" NOT NULL,
    "legal_name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "tenant_id" TEXT,
    "jurisdiction" TEXT NOT NULL DEFAULT 'AU',
    "registration_reference" TEXT,
    "public_contact_reference" TEXT,
    "private_operational_contact_reference" TEXT,
    "status" "CivicAccessEntityStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "accessops_civic_entities_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "accessops_civic_entities_entity_type_status_idx" ON "accessops_civic_entities"("entity_type", "status");
CREATE INDEX "accessops_civic_entities_tenant_id_idx" ON "accessops_civic_entities"("tenant_id");
-- CreateTable
CREATE TABLE "accessops_asset_responsibilities" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "responsibility_type" "AccessResponsibilityType" NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" TIMESTAMP(3),
    "evidence_reference" TEXT,
    "verified_at" TIMESTAMP(3),
    "verified_by_id" TEXT,
    "status" "AccessResponsibilityStatus" NOT NULL DEFAULT 'asserted',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "accessops_asset_responsibilities_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "accessops_asset_responsibilities_asset_id_responsibility_type_status_idx" ON "accessops_asset_responsibilities"("asset_id", "responsibility_type", "status");
CREATE INDEX "accessops_asset_responsibilities_entity_id_idx" ON "accessops_asset_responsibilities"("entity_id");
-- CreateTable
CREATE TABLE "accessops_reliability_profiles" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "measurement_window" TEXT NOT NULL,
    "expected_operating_schedule" JSONB NOT NULL,
    "availability_target" DOUBLE PRECISION,
    "maximum_unplanned_outage_minutes" INTEGER,
    "maximum_restore_time_minutes" INTEGER,
    "status_freshness_target_seconds" INTEGER,
    "reporting_completeness_target" DOUBLE PRECISION,
    "policy_version" TEXT NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "accessops_reliability_profiles_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "accessops_reliability_profiles_asset_id_effective_from_idx" ON "accessops_reliability_profiles"("asset_id", "effective_from");
-- CreateTable
CREATE TABLE "accessops_reliability_measurements" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "window_start" TIMESTAMP(3) NOT NULL,
    "window_end" TIMESTAMP(3) NOT NULL,
    "expected_available_minutes" INTEGER NOT NULL,
    "verified_available_minutes" INTEGER NOT NULL,
    "degraded_minutes" INTEGER NOT NULL DEFAULT 0,
    "unavailable_minutes" INTEGER NOT NULL DEFAULT 0,
    "unknown_minutes" INTEGER NOT NULL DEFAULT 0,
    "scheduled_maintenance_minutes" INTEGER NOT NULL DEFAULT 0,
    "unplanned_outage_count" INTEGER NOT NULL DEFAULT 0,
    "mean_restore_minutes" DOUBLE PRECISION,
    "longest_outage_minutes" DOUBLE PRECISION,
    "status_coverage_percent" DOUBLE PRECISION NOT NULL,
    "evidence_completeness" DOUBLE PRECISION NOT NULL,
    "calculation_version" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "accessops_reliability_measurements_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "accessops_reliability_measurements_asset_id_window_start_idx" ON "accessops_reliability_measurements"("asset_id", "window_start");
-- CreateTable
CREATE TABLE "accessops_slo_profiles" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT,
    "asset_type" "AccessAssetType",
    "slo_key" TEXT NOT NULL,
    "target_value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "policy_version" TEXT NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "accessops_slo_profiles_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "accessops_slo_profiles_slo_key_effective_from_idx" ON "accessops_slo_profiles"("slo_key", "effective_from");
CREATE INDEX "accessops_slo_profiles_asset_id_idx" ON "accessops_slo_profiles"("asset_id");
-- CreateTable
CREATE TABLE "accessops_slo_breaches" (
    "id" TEXT NOT NULL,
    "slo_profile_id" TEXT NOT NULL,
    "asset_id" TEXT,
    "observed_value" DOUBLE PRECISION NOT NULL,
    "error_budget_remaining" DOUBLE PRECISION,
    "review_required" BOOLEAN NOT NULL DEFAULT TRUE,
    "penalty_automatic" BOOLEAN NOT NULL DEFAULT FALSE,
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),
    "narrative" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "accessops_slo_breaches_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "accessops_slo_breaches_slo_profile_id_opened_at_idx" ON "accessops_slo_breaches"("slo_profile_id", "opened_at");
-- CreateTable
CREATE TABLE "accessops_incidents" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "legacy_indoor_incident_id" TEXT,
    "category" "AccessIncidentCategory" NOT NULL,
    "state" "AccessIncidentState" NOT NULL DEFAULT 'reported',
    "title" TEXT NOT NULL,
    "safe_description" TEXT NOT NULL,
    "evidence_level" "AccessEvidenceLevel" NOT NULL DEFAULT 'community_observed',
    "source_type" TEXT NOT NULL,
    "reporter_opaque_ref" TEXT,
    "owner_notified_at" TIMESTAMP(3),
    "operator_notified_at" TIMESTAMP(3),
    "restoration_evidence_ref" TEXT,
    "recurring_flag" BOOLEAN NOT NULL DEFAULT FALSE,
    "systemic_review_required" BOOLEAN NOT NULL DEFAULT FALSE,
    "reported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged_at" TIMESTAMP(3),
    "restored_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "accessops_incidents_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "accessops_incidents_legacy_indoor_incident_id_key" ON "accessops_incidents"("legacy_indoor_incident_id");
CREATE INDEX "accessops_incidents_asset_id_state_idx" ON "accessops_incidents"("asset_id", "state");
CREATE INDEX "accessops_incidents_state_reported_at_idx" ON "accessops_incidents"("state", "reported_at");
-- CreateTable
CREATE TABLE "accessops_work_orders" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "incident_id" TEXT,
    "owner_entity_id" TEXT,
    "operator_entity_id" TEXT,
    "maintainer_entity_id" TEXT,
    "work_type" "AccessWorkOrderType" NOT NULL,
    "priority" "AccessWorkOrderPriority" NOT NULL DEFAULT 'medium',
    "title" TEXT NOT NULL,
    "safe_description" TEXT NOT NULL,
    "private_technical_description_reference" TEXT,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged_at" TIMESTAMP(3),
    "scheduled_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "verification_required" BOOLEAN NOT NULL DEFAULT TRUE,
    "verified_at" TIMESTAMP(3),
    "verified_by_id" TEXT,
    "status" "AccessWorkOrderStatus" NOT NULL DEFAULT 'requested',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "accessops_work_orders_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "accessops_work_orders_asset_id_status_idx" ON "accessops_work_orders"("asset_id", "status");
CREATE INDEX "accessops_work_orders_incident_id_idx" ON "accessops_work_orders"("incident_id");
-- CreateTable
CREATE TABLE "accessops_community_reports" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "kind" "AccessCommunityReportKind" NOT NULL,
    "status" "AccessCommunityReportStatus" NOT NULL DEFAULT 'submitted',
    "safe_narrative" TEXT NOT NULL,
    "evidence_level" "AccessEvidenceLevel" NOT NULL DEFAULT 'community_observed',
    "reporter_opaque_ref" TEXT,
    "wants_updates" BOOLEAN NOT NULL DEFAULT FALSE,
    "provisional_outage" BOOLEAN NOT NULL DEFAULT FALSE,
    "evidenceRefs" JSONB,
    "moderated_at" TIMESTAMP(3),
    "withdrawn_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "accessops_community_reports_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "accessops_community_reports_asset_id_status_idx" ON "accessops_community_reports"("asset_id", "status");
CREATE INDEX "accessops_community_reports_kind_created_at_idx" ON "accessops_community_reports"("kind", "created_at");
-- CreateTable
CREATE TABLE "accessops_sensor_devices" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "device_identifier" TEXT NOT NULL,
    "device_type" "AccessSensorDeviceType" NOT NULL,
    "manufacturer" TEXT,
    "model" TEXT,
    "firmware_version" TEXT,
    "gateway_id" TEXT,
    "protocol" TEXT NOT NULL,
    "observation_types" JSONB NOT NULL,
    "installation_date" TIMESTAMP(3),
    "calibration_status" "AccessSensorCalibrationStatus" NOT NULL DEFAULT 'unknown',
    "last_calibration_at" TIMESTAMP(3),
    "next_calibration_at" TIMESTAMP(3),
    "health_status" "AccessSensorHealthStatus" NOT NULL DEFAULT 'unknown',
    "trust_status" "AccessSensorTrustStatus" NOT NULL DEFAULT 'untrusted',
    "thing_description_reference" TEXT,
    "sensor_things_reference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'registered',
    "production_activated" BOOLEAN NOT NULL DEFAULT FALSE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "accessops_sensor_devices_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "accessops_sensor_devices_device_identifier_key" ON "accessops_sensor_devices"("device_identifier");
CREATE INDEX "accessops_sensor_devices_asset_id_health_status_idx" ON "accessops_sensor_devices"("asset_id", "health_status");
CREATE INDEX "accessops_sensor_devices_trust_status_status_idx" ON "accessops_sensor_devices"("trust_status", "status");
-- CreateTable
CREATE TABLE "accessops_sensor_observations" (
    "id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "observation_type" TEXT NOT NULL,
    "result_value" JSONB NOT NULL,
    "unit" TEXT,
    "phenomenon_time" TIMESTAMP(3) NOT NULL,
    "result_time" TIMESTAMP(3) NOT NULL,
    "external_id" TEXT,
    "integrity_ok" BOOLEAN NOT NULL DEFAULT TRUE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "accessops_sensor_observations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "accessops_sensor_observations_device_id_external_id_key" ON "accessops_sensor_observations"("device_id", "external_id");
CREATE INDEX "accessops_sensor_observations_device_id_phenomenon_time_idx" ON "accessops_sensor_observations"("device_id", "phenomenon_time");
-- CreateTable
CREATE TABLE "accessops_curb_zones" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "geometry_reference" TEXT NOT NULL,
    "zone_type" "AccessCurbZoneType" NOT NULL,
    "vehicle_types" JSONB NOT NULL,
    "permit_requirements" JSONB,
    "operating_schedule" JSONB NOT NULL,
    "maximum_stay_minutes" INTEGER,
    "accessibility_features" JSONB NOT NULL,
    "source_reference" TEXT NOT NULL,
    "operator_entity_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "accessops_curb_zones_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "accessops_curb_zones_asset_id_zone_type_idx" ON "accessops_curb_zones"("asset_id", "zone_type");
-- CreateTable
CREATE TABLE "accessops_journey_plans" (
    "id" TEXT NOT NULL,
    "participant_id" TEXT,
    "tenant_id" TEXT,
    "request_id" TEXT NOT NULL,
    "graph_versions" JSONB NOT NULL,
    "source_versions" JSONB NOT NULL,
    "status_snapshot_id" TEXT NOT NULL,
    "preference_snapshot_id" TEXT,
    "consent_directive_ids" JSONB NOT NULL,
    "origin" JSONB NOT NULL,
    "destination" JSONB NOT NULL,
    "departure_window" JSONB NOT NULL,
    "arrival_target" TIMESTAMP(3),
    "route_options" JSONB NOT NULL,
    "selected_route_id" TEXT,
    "retain_origin" BOOLEAN NOT NULL DEFAULT FALSE,
    "status" "AccessJourneyPlanStatus" NOT NULL DEFAULT 'draft',
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "accessops_journey_plans_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "accessops_journey_plans_request_id_key" ON "accessops_journey_plans"("request_id");
CREATE INDEX "accessops_journey_plans_participant_id_status_idx" ON "accessops_journey_plans"("participant_id", "status");
CREATE INDEX "accessops_journey_plans_tenant_id_status_idx" ON "accessops_journey_plans"("tenant_id", "status");
CREATE INDEX "accessops_journey_plans_expires_at_idx" ON "accessops_journey_plans"("expires_at");
-- CreateTable
CREATE TABLE "accessops_graph_publications" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "floor_plan_id" TEXT,
    "version" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "status" "AccessGraphPublicationStatus" NOT NULL DEFAULT 'draft',
    "graph_json_ref" TEXT NOT NULL,
    "published_at" TIMESTAMP(3),
    "superseded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "accessops_graph_publications_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "accessops_graph_publications_asset_id_version_key" ON "accessops_graph_publications"("asset_id", "version");
CREATE INDEX "accessops_graph_publications_floor_plan_id_status_idx" ON "accessops_graph_publications"("floor_plan_id", "status");
-- CreateTable
CREATE TABLE "accessops_webhook_subscriptions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "destination_url" TEXT NOT NULL,
    "event_types" JSONB NOT NULL,
    "secret_hash" TEXT NOT NULL,
    "secret_hint" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "allowlisted_host" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "accessops_webhook_subscriptions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "accessops_webhook_subscriptions_tenant_id_client_id_status_idx" ON "accessops_webhook_subscriptions"("tenant_id", "client_id", "status");
-- CreateTable
CREATE TABLE "accessops_webhook_deliveries" (
    "id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "schema_version" TEXT NOT NULL,
    "payload_json" JSONB NOT NULL,
    "status" "AccessWebhookDeliveryStatus" NOT NULL DEFAULT 'queued',
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "next_attempt_at" TIMESTAMP(3),
    "last_error" TEXT,
    "delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "accessops_webhook_deliveries_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "accessops_webhook_deliveries_subscription_id_event_id_key" ON "accessops_webhook_deliveries"("subscription_id", "event_id");
CREATE INDEX "accessops_webhook_deliveries_status_next_attempt_at_idx" ON "accessops_webhook_deliveries"("status", "next_attempt_at");
-- CreateTable
CREATE TABLE "accessops_partner_clients" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "client_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "scopes" JSONB NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "rate_limit_rpm" INTEGER NOT NULL DEFAULT 60,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "accessops_partner_clients_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "accessops_partner_clients_client_key_key" ON "accessops_partner_clients"("client_key");
CREATE INDEX "accessops_partner_clients_tenant_id_status_idx" ON "accessops_partner_clients"("tenant_id", "status");
-- CreateTable
CREATE TABLE "accessops_assurance_assessments" (
    "id" TEXT NOT NULL,
    "control_area" TEXT NOT NULL,
    "outcome" "AccessOpsAssuranceOutcome" NOT NULL DEFAULT 'not_assessed',
    "evidence_refs" JSONB NOT NULL,
    "expires_at" TIMESTAMP(3),
    "restricts_publication" BOOLEAN NOT NULL DEFAULT FALSE,
    "restricts_routing" BOOLEAN NOT NULL DEFAULT FALSE,
    "remediation_ref" TEXT,
    "assessed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assessed_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "accessops_assurance_assessments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "accessops_assurance_assessments_control_area_outcome_idx" ON "accessops_assurance_assessments"("control_area", "outcome");
