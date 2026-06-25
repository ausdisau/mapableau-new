-- CreateEnum
CREATE TYPE "AccessReportType" AS ENUM ('venue', 'route', 'toilet', 'parking', 'entrance', 'transport_stop', 'sensory', 'temporary_alert');
CREATE TYPE "AccessAlertType" AS ENUM ('broken_lift', 'blocked_ramp', 'inaccessible_toilet', 'construction_barrier', 'inaccessible_transport_stop', 'temporary_closure', 'crowding_risk', 'sensory_overload', 'urgent_hazard', 'other');
CREATE TYPE "AccessAlertStatus" AS ENUM ('active', 'resolved', 'expired', 'disputed');
CREATE TYPE "AccessDomain" AS ENUM ('mobility', 'sensory', 'communication', 'cognitive', 'service');
CREATE TYPE "AccessVerificationTarget" AS ENUM ('review', 'alert', 'place_feature');
CREATE TYPE "AccessVerificationAction" AS ENUM ('confirm', 'outdated', 'dispute', 'resolve', 'suggest_edit');
CREATE TYPE "AccessCommunityRole" AS ENUM ('community_mapper', 'verified_mapper', 'access_ambassador', 'venue_owner', 'moderator', 'council_partner');

-- AlterTable access_reviews
ALTER TABLE "access_reviews" ADD COLUMN "report_type" "AccessReportType" NOT NULL DEFAULT 'venue';
ALTER TABLE "access_reviews" ADD COLUMN "visited_in_person" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "access_reviews" ADD COLUMN "measurements_json" JSONB;
ALTER TABLE "access_reviews" ADD COLUMN "draft_key" TEXT;
ALTER TABLE "access_reviews" ADD COLUMN "submitted_at" TIMESTAMP(3);
ALTER TABLE "access_reviews" ADD COLUMN "confidence_score" DOUBLE PRECISION;

CREATE INDEX "access_reviews_reviewer_profile_id_draft_key_idx" ON "access_reviews"("reviewer_profile_id", "draft_key");

-- AlterTable AccessibilityProfile
ALTER TABLE "AccessibilityProfile" ADD COLUMN "place_matching_requirements" JSONB NOT NULL DEFAULT '{}';

-- AlterTable transport_trip_requests
ALTER TABLE "transport_trip_requests" ADD COLUMN "destination_access_place_id" TEXT;
ALTER TABLE "transport_trip_requests" ADD COLUMN "access_destination_profile_json" JSONB;
ALTER TABLE "transport_trip_requests" ADD COLUMN "journey_confidence_json" JSONB;

-- AlterTable transport_trips
ALTER TABLE "transport_trips" ADD COLUMN "destination_access_place_id" TEXT;
ALTER TABLE "transport_trips" ADD COLUMN "access_destination_profile_json" JSONB;
ALTER TABLE "transport_trips" ADD COLUMN "journey_confidence_json" JSONB;

-- CreateTable access_place_domain_summaries
CREATE TABLE "access_place_domain_summaries" (
    "id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "domain" "AccessDomain" NOT NULL,
    "score" DOUBLE PRECISION,
    "sample_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_place_domain_summaries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "access_place_domain_summaries_place_id_domain_key" ON "access_place_domain_summaries"("place_id", "domain");

-- CreateTable access_alerts
CREATE TABLE "access_alerts" (
    "id" TEXT NOT NULL,
    "place_id" TEXT,
    "alert_type" "AccessAlertType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "AccessAlertStatus" NOT NULL DEFAULT 'active',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "expires_at" TIMESTAMP(3),
    "review_at" TIMESTAMP(3),
    "reported_by" TEXT,
    "confidence" "AccessConfidenceLevel" NOT NULL DEFAULT 'user_reported',
    "source_review_id" TEXT,
    "resolved_by" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_alerts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "access_alerts_status_expires_at_idx" ON "access_alerts"("status", "expires_at");
CREATE INDEX "access_alerts_place_id_status_idx" ON "access_alerts"("place_id", "status");

-- CreateTable access_verifications
CREATE TABLE "access_verifications" (
    "id" TEXT NOT NULL,
    "target_type" "AccessVerificationTarget" NOT NULL,
    "target_id" TEXT NOT NULL,
    "action" "AccessVerificationAction" NOT NULL,
    "user_id" TEXT NOT NULL,
    "notes" TEXT,
    "evidence_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_verifications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "access_verifications_target_type_target_id_user_id_action_key" ON "access_verifications"("target_type", "target_id", "user_id", "action");
CREATE INDEX "access_verifications_target_type_target_id_idx" ON "access_verifications"("target_type", "target_id");

-- CreateTable access_badge_definitions
CREATE TABLE "access_badge_definitions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "criteria_json" JSONB NOT NULL,

    CONSTRAINT "access_badge_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable user_access_badges
CREATE TABLE "user_access_badges" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "badge_id" TEXT NOT NULL,
    "awarded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_access_badges_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_access_badges_user_id_badge_id_key" ON "user_access_badges"("user_id", "badge_id");

-- CreateTable user_access_contributions
CREATE TABLE "user_access_contributions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_access_contributions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "user_access_contributions_user_id_created_at_idx" ON "user_access_contributions"("user_id", "created_at");

-- CreateTable user_access_community_roles
CREATE TABLE "user_access_community_roles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "AccessCommunityRole" NOT NULL,
    "granted_by" TEXT,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_access_community_roles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_access_community_roles_user_id_role_key" ON "user_access_community_roles"("user_id", "role");

-- CreateTable access_trip_feedback
CREATE TABLE "access_trip_feedback" (
    "id" TEXT NOT NULL,
    "trip_id" TEXT NOT NULL,
    "place_id" TEXT,
    "dropoff_accessible" BOOLEAN,
    "entrance_correct" BOOLEAN,
    "barriers_notes" TEXT,
    "create_alert" BOOLEAN NOT NULL DEFAULT false,
    "submitted_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_trip_feedback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "access_trip_feedback_trip_id_key" ON "access_trip_feedback"("trip_id");

-- AddForeignKey
ALTER TABLE "access_place_domain_summaries" ADD CONSTRAINT "access_place_domain_summaries_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "access_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "access_alerts" ADD CONSTRAINT "access_alerts_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "access_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "access_alerts" ADD CONSTRAINT "access_alerts_reported_by_fkey" FOREIGN KEY ("reported_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "access_alerts" ADD CONSTRAINT "access_alerts_source_review_id_fkey" FOREIGN KEY ("source_review_id") REFERENCES "access_reviews"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "access_alerts" ADD CONSTRAINT "access_alerts_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "access_verifications" ADD CONSTRAINT "access_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "user_access_badges" ADD CONSTRAINT "user_access_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_access_badges" ADD CONSTRAINT "user_access_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "access_badge_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "user_access_contributions" ADD CONSTRAINT "user_access_contributions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_access_community_roles" ADD CONSTRAINT "user_access_community_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "access_trip_feedback" ADD CONSTRAINT "access_trip_feedback_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "transport_trip_requests" ADD CONSTRAINT "transport_trip_requests_destination_access_place_id_fkey" FOREIGN KEY ("destination_access_place_id") REFERENCES "access_places"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "transport_trips" ADD CONSTRAINT "transport_trips_destination_access_place_id_fkey" FOREIGN KEY ("destination_access_place_id") REFERENCES "access_places"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed badge definitions
INSERT INTO "access_badge_definitions" ("id", "name", "description", "criteria_json") VALUES
('first_report', 'First Report', 'Submitted your first access report', '{"minReports":1}'),
('local_mapper', 'Local Mapper', 'Contributed 5 reports in your area', '{"minReports":5}'),
('toilet_tracker', 'Toilet Tracker', 'Reported on accessible toilets', '{"reportTypes":["toilet"]}'),
('ramp_ranger', 'Ramp Ranger', 'Reported on ramps and entrances', '{"reportTypes":["entrance","parking"]}'),
('sensory_scout', 'Sensory Scout', 'Reported on sensory conditions', '{"reportTypes":["sensory"]}'),
('verified_mapper', 'Verified Mapper', 'Promoted to verified community mapper', '{"role":"verified_mapper"}'),
('access_ambassador', 'Access Ambassador', 'Recognised access ambassador', '{"role":"access_ambassador"}');
