-- MapAble Go slice 1 — additive models and consent scopes

-- CreateEnum
CREATE TYPE "GoLocationPurpose" AS ENUM ('current_location', 'route_history', 'barrier_report');
CREATE TYPE "GoLocationPrecision" AS ENUM ('coarse', 'precise');
CREATE TYPE "AccessTemporaryBarrierType" AS ENUM ('blocked_path', 'lift_outage', 'construction', 'poor_surface', 'missing_curb_ramp', 'narrow_path', 'unsafe_crossing', 'other');

-- AlterEnum
ALTER TYPE "ConsentScope" ADD VALUE 'go_current_location';
ALTER TYPE "ConsentScope" ADD VALUE 'go_route_history';
ALTER TYPE "ConsentScope" ADD VALUE 'go_barrier_report';

-- CreateTable
CREATE TABLE "access_mobility_routing_preferences" (
    "id" TEXT NOT NULL,
    "passport_id" TEXT NOT NULL,
    "mobility_aid_type" TEXT,
    "chair_width_mm" INTEGER,
    "chair_length_mm" INTEGER,
    "minimum_preferred_path_width_mm" INTEGER,
    "preferred_maximum_slope_percent" DOUBLE PRECISION,
    "absolute_maximum_slope_percent" DOUBLE PRECISION,
    "preferred_maximum_cross_slope_percent" DOUBLE PRECISION,
    "curb_ramp_required" BOOLEAN NOT NULL DEFAULT true,
    "stairs_allowed" BOOLEAN NOT NULL DEFAULT false,
    "preferred_surface_types" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "avoided_surface_types" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rough_surface_tolerance" TEXT,
    "unknown_segment_policy" TEXT NOT NULL DEFAULT 'allow_with_warning',
    "low_confidence_policy" TEXT NOT NULL DEFAULT 'allow_with_warning',
    "lift_requirement" BOOLEAN NOT NULL DEFAULT false,
    "accessible_toilet_preference" BOOLEAN NOT NULL DEFAULT false,
    "rest_stop_preference" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_mobility_routing_preferences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "access_path_nodes" (
    "id" TEXT NOT NULL,
    "graph_id" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_path_nodes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "access_path_segments" (
    "id" TEXT NOT NULL,
    "graph_id" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "from_external_node_id" TEXT NOT NULL,
    "to_external_node_id" TEXT NOT NULL,
    "bidirectional" BOOLEAN NOT NULL DEFAULT true,
    "length_metres" DOUBLE PRECISION NOT NULL,
    "width_mm" INTEGER,
    "longitudinal_slope_percent" DOUBLE PRECISION NOT NULL,
    "cross_slope_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "surface_type" TEXT NOT NULL,
    "surface_condition" TEXT NOT NULL DEFAULT 'unknown',
    "curb_cut" BOOLEAN NOT NULL DEFAULT false,
    "curb_cut_width_mm" INTEGER,
    "stairs" INTEGER NOT NULL DEFAULT 0,
    "crossing_type" TEXT NOT NULL DEFAULT 'none',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "source_class" TEXT NOT NULL,
    "last_observed_at" TIMESTAMP(3),
    "last_human_verified_at" TIMESTAMP(3),
    "accessibility_evidence_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_path_segments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "access_temporary_barriers" (
    "id" TEXT NOT NULL,
    "segment_external_id" TEXT NOT NULL,
    "graph_id" TEXT NOT NULL,
    "type" "AccessTemporaryBarrierType" NOT NULL,
    "reported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "source" TEXT NOT NULL DEFAULT 'community',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "verification_state" TEXT NOT NULL DEFAULT 'community_reported',
    "description" TEXT,
    "reporter_user_id" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_temporary_barriers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "go_location_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "purpose" "GoLocationPurpose" NOT NULL,
    "precision" "GoLocationPrecision" NOT NULL DEFAULT 'coarse',
    "consent_record_id" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "go_location_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "go_route_plans" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "passport_id" TEXT,
    "destination_place_id" TEXT,
    "selected_route_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "graph_source" TEXT NOT NULL,
    "is_live_evidence" BOOLEAN NOT NULL DEFAULT false,
    "route_payload" JSONB NOT NULL,
    "journey_record_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "go_route_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "access_mobility_routing_preferences_passport_id_key" ON "access_mobility_routing_preferences"("passport_id");
CREATE UNIQUE INDEX "access_path_nodes_graph_id_external_id_key" ON "access_path_nodes"("graph_id", "external_id");
CREATE INDEX "access_path_nodes_graph_id_idx" ON "access_path_nodes"("graph_id");
CREATE UNIQUE INDEX "access_path_segments_graph_id_external_id_key" ON "access_path_segments"("graph_id", "external_id");
CREATE INDEX "access_path_segments_graph_id_idx" ON "access_path_segments"("graph_id");
CREATE INDEX "access_temporary_barriers_graph_id_segment_external_id_idx" ON "access_temporary_barriers"("graph_id", "segment_external_id");
CREATE INDEX "access_temporary_barriers_expires_at_idx" ON "access_temporary_barriers"("expires_at");
CREATE INDEX "go_location_sessions_user_id_purpose_idx" ON "go_location_sessions"("user_id", "purpose");
CREATE INDEX "go_location_sessions_expires_at_idx" ON "go_location_sessions"("expires_at");
CREATE INDEX "go_route_plans_user_id_created_at_idx" ON "go_route_plans"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "access_mobility_routing_preferences" ADD CONSTRAINT "access_mobility_routing_preferences_passport_id_fkey" FOREIGN KEY ("passport_id") REFERENCES "access_passports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "access_temporary_barriers" ADD CONSTRAINT "access_temporary_barriers_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "go_location_sessions" ADD CONSTRAINT "go_location_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "go_route_plans" ADD CONSTRAINT "go_route_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "go_route_plans" ADD CONSTRAINT "go_route_plans_destination_place_id_fkey" FOREIGN KEY ("destination_place_id") REFERENCES "access_places"("id") ON DELETE SET NULL ON UPDATE CASCADE;
