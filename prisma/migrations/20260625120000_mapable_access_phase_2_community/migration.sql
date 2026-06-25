-- MapAble Access Phase 2: community features

-- CreateEnum
CREATE TYPE "AccessReportType" AS ENUM ('venue', 'route', 'toilet', 'parking', 'transport_stop', 'sensory', 'temporary_alert', 'entrance');
CREATE TYPE "AccessDomain" AS ENUM ('mobility', 'sensory', 'communication', 'cognitive', 'service');
CREATE TYPE "AccessAlertType" AS ENUM ('broken_lift', 'blocked_ramp', 'inaccessible_toilet', 'construction_barrier', 'inaccessible_transport_stop', 'temporary_closure', 'crowding_sensory_risk', 'urgent_hazard');
CREATE TYPE "AccessAlertStatus" AS ENUM ('active', 'resolved', 'expired', 'disputed');
CREATE TYPE "AccessVerificationAction" AS ENUM ('confirm', 'outdated', 'dispute', 'add_evidence', 'resolve_alert', 'suggest_edit');
CREATE TYPE "AccessCommunityRole" AS ENUM ('visitor', 'registered_user', 'community_mapper', 'verified_mapper', 'access_ambassador', 'venue_owner', 'moderator', 'admin', 'council_partner');

-- AlterEnum AccessReviewStatus
ALTER TYPE "AccessReviewStatus" ADD VALUE IF NOT EXISTS 'disputed';
ALTER TYPE "AccessReviewStatus" ADD VALUE IF NOT EXISTS 'archived';

-- AlterTable access_reviews
ALTER TABLE "access_reviews" ADD COLUMN IF NOT EXISTS "report_type" "AccessReportType" NOT NULL DEFAULT 'venue';
ALTER TABLE "access_reviews" ADD COLUMN IF NOT EXISTS "visited_in_person" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "access_reviews" ADD COLUMN IF NOT EXISTS "measurements" JSONB;
ALTER TABLE "access_reviews" ADD COLUMN IF NOT EXISTS "evidence_notes" TEXT;

-- CreateTable access_place_domain_summaries
CREATE TABLE IF NOT EXISTS "access_place_domain_summaries" (
    "id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "domain" "AccessDomain" NOT NULL,
    "score" DOUBLE PRECISION,
    "confidence_score" DOUBLE PRECISION,
    "sample_count" INTEGER NOT NULL DEFAULT 0,
    "last_updated" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "access_place_domain_summaries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "access_place_domain_summaries_place_id_domain_key" ON "access_place_domain_summaries"("place_id", "domain");

ALTER TABLE "access_place_domain_summaries" ADD CONSTRAINT "access_place_domain_summaries_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "access_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable access_alerts
CREATE TABLE IF NOT EXISTS "access_alerts" (
    "id" TEXT NOT NULL,
    "place_id" TEXT,
    "report_id" TEXT,
    "alert_type" "AccessAlertType" NOT NULL,
    "status" "AccessAlertStatus" NOT NULL DEFAULT 'active',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "submitted_by" TEXT,
    "confidence_level" "AccessConfidenceLevel" NOT NULL DEFAULT 'user_reported',
    "expires_at" TIMESTAMP(3),
    "review_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "resolved_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "access_alerts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "access_alerts_status_expires_at_idx" ON "access_alerts"("status", "expires_at");

ALTER TABLE "access_alerts" ADD CONSTRAINT "access_alerts_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "access_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "access_alerts" ADD CONSTRAINT "access_alerts_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "access_reviews"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "access_alerts" ADD CONSTRAINT "access_alerts_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "access_alerts" ADD CONSTRAINT "access_alerts_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable access_alert_photos
CREATE TABLE IF NOT EXISTS "access_alert_photos" (
    "id" TEXT NOT NULL,
    "alert_id" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "alt_text" TEXT,
    "mime_type" TEXT,
    "status" "AccessModerationStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "access_alert_photos_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "access_alert_photos" ADD CONSTRAINT "access_alert_photos_alert_id_fkey" FOREIGN KEY ("alert_id") REFERENCES "access_alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable access_verifications
CREATE TABLE IF NOT EXISTS "access_verifications" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" "AccessVerificationAction" NOT NULL,
    "user_id" TEXT NOT NULL,
    "notes" TEXT,
    "evidence" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "access_verifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "access_verifications_entity_type_entity_id_idx" ON "access_verifications"("entity_type", "entity_id");

ALTER TABLE "access_verifications" ADD CONSTRAINT "access_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable access_disputes
CREATE TABLE IF NOT EXISTS "access_disputes" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "raised_by" TEXT NOT NULL,
    "reason" "AccessContentReportReason" NOT NULL,
    "details" TEXT,
    "status" "AccessModerationStatus" NOT NULL DEFAULT 'pending',
    "resolution" TEXT,
    "resolved_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "access_disputes_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "access_disputes" ADD CONSTRAINT "access_disputes_raised_by_fkey" FOREIGN KEY ("raised_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable access_community_memberships
CREATE TABLE IF NOT EXISTS "access_community_memberships" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "AccessCommunityRole" NOT NULL,
    "region" TEXT,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "granted_by" TEXT,
    CONSTRAINT "access_community_memberships_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "access_community_memberships_user_id_role_key" ON "access_community_memberships"("user_id", "role");

ALTER TABLE "access_community_memberships" ADD CONSTRAINT "access_community_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable access_badges
CREATE TABLE IF NOT EXISTS "access_badges" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    CONSTRAINT "access_badges_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "access_badges_code_key" ON "access_badges"("code");

-- CreateTable user_access_badges
CREATE TABLE IF NOT EXISTS "user_access_badges" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "badge_id" TEXT NOT NULL,
    "earned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    CONSTRAINT "user_access_badges_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_access_badges_user_id_badge_id_key" ON "user_access_badges"("user_id", "badge_id");

ALTER TABLE "user_access_badges" ADD CONSTRAINT "user_access_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_access_badges" ADD CONSTRAINT "user_access_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "access_badges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable user_contributions
CREATE TABLE IF NOT EXISTS "user_contributions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "points" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_contributions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "user_contributions_user_id_created_at_idx" ON "user_contributions"("user_id", "created_at");

ALTER TABLE "user_contributions" ADD CONSTRAINT "user_contributions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed badge definitions
INSERT INTO "access_badges" ("id", "code", "title", "description") VALUES
  ('badge_first_report', 'first_report', 'First Report', 'Submitted your first access report'),
  ('badge_local_mapper', 'local_mapper', 'Local Mapper', 'Contributed 5 reports in your local area'),
  ('badge_toilet_tracker', 'toilet_tracker', 'Toilet Tracker', 'Reported on 3 accessible toilets'),
  ('badge_ramp_ranger', 'ramp_ranger', 'Ramp Ranger', 'Reported on ramp and entrance access'),
  ('badge_sensory_scout', 'sensory_scout', 'Sensory Scout', 'Contributed sensory access information'),
  ('badge_verified_mapper', 'verified_mapper', 'Verified Mapper', 'Recognised as a trusted community mapper'),
  ('badge_access_ambassador', 'access_ambassador', 'Access Ambassador', 'Regional access community leader')
ON CONFLICT ("code") DO NOTHING;
