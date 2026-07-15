-- Accessibility reviews v1 (Access domain extension)

-- AlterEnum NotificationCategory
ALTER TYPE "NotificationCategory" ADD VALUE IF NOT EXISTS 'access';

-- AlterEnum AccessRatingValue
ALTER TYPE "AccessRatingValue" ADD VALUE IF NOT EXISTS 'not_observed';
ALTER TYPE "AccessRatingValue" ADD VALUE IF NOT EXISTS 'very_difficult';
ALTER TYPE "AccessRatingValue" ADD VALUE IF NOT EXISTS 'difficult';
ALTER TYPE "AccessRatingValue" ADD VALUE IF NOT EXISTS 'mixed';
ALTER TYPE "AccessRatingValue" ADD VALUE IF NOT EXISTS 'very_good';

-- AlterEnum AccessContentReportReason
ALTER TYPE "AccessContentReportReason" ADD VALUE IF NOT EXISTS 'outdated_information';
ALTER TYPE "AccessContentReportReason" ADD VALUE IF NOT EXISTS 'privacy_concern';
ALTER TYPE "AccessContentReportReason" ADD VALUE IF NOT EXISTS 'suspected_fake_contribution';
ALTER TYPE "AccessContentReportReason" ADD VALUE IF NOT EXISTS 'conflict_of_interest';
ALTER TYPE "AccessContentReportReason" ADD VALUE IF NOT EXISTS 'inappropriate_media';
ALTER TYPE "AccessContentReportReason" ADD VALUE IF NOT EXISTS 'serious_safety_concern';

-- CreateEnums
CREATE TYPE "AccessOverallExperience" AS ENUM ('completely', 'mostly', 'partly', 'barely', 'not_at_all', 'prefer_not');
CREATE TYPE "AccessObservationSource" AS ENUM ('in_person', 'venue_inspection', 'other');
CREATE TYPE "AccessVisitTimePrecision" AS ENUM ('none', 'approximate', 'exact');
CREATE TYPE "AccessTagSentiment" AS ENUM ('positive', 'barrier');
CREATE TYPE "AccessCommentType" AS ENUM ('access_tip', 'barrier_report', 'temporary_issue', 'feature_confirmation', 'question', 'venue_response', 'improvement_update');
CREATE TYPE "AccessCommentStatus" AS ENUM ('draft', 'pending', 'published', 'restricted', 'removed');
CREATE TYPE "AccessFeatureAnchor" AS ENUM ('whole_place', 'parking', 'drop_off', 'path', 'entrance', 'door', 'interior_path', 'ramp', 'lift', 'counter', 'seating', 'toilet', 'signage', 'hearing_access', 'lighting_acoustics', 'staff_assistance', 'online_information');
CREATE TYPE "AccessReactionType" AS ENUM ('helpful', 'confirm', 'changed');
CREATE TYPE "AccessReactionTargetType" AS ENUM ('review', 'comment');
CREATE TYPE "AccessAlertStatus" AS ENUM ('active', 'expired', 'outdated', 'resolved', 'removed');
CREATE TYPE "AccessIssueHistoryState" AS ENUM ('reported', 'confirmed', 'venue_responded', 'being_investigated', 'resolved', 'reopened', 'outdated', 'removed');
CREATE TYPE "AccessContributionStatus" AS ENUM ('pending', 'final', 'reversed');
CREATE TYPE "AccessCommunityConfidence" AS ENUM ('limited', 'developing', 'well_supported', 'recently_verified');
CREATE TYPE "AccessMappingChallengeStatus" AS ENUM ('draft', 'active', 'completed', 'cancelled');
CREATE TYPE "AccessEvidenceType" AS ENUM ('photo', 'video', 'audio', 'measurement', 'document');
CREATE TYPE "AccessEvidenceProvenance" AS ENUM ('community', 'venue', 'verified_assessor');
CREATE TYPE "AccessEvidenceVerification" AS ENUM ('unverified', 'pending', 'verified', 'rejected');

-- AlterTable access_reviews
ALTER TABLE "access_reviews"
  ADD COLUMN IF NOT EXISTS "visit_time_precision" "AccessVisitTimePrecision" NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS "observation_source" "AccessObservationSource" NOT NULL DEFAULT 'in_person',
  ADD COLUMN IF NOT EXISTS "overall_experience" "AccessOverallExperience",
  ADD COLUMN IF NOT EXISTS "temporary_issue" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "access_context_json" JSONB,
  ADD COLUMN IF NOT EXISTS "published_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "access_reviews_reviewer_profile_id_created_at_idx" ON "access_reviews"("reviewer_profile_id", "created_at");

-- AccessDimensionSummary
CREATE TABLE IF NOT EXISTS "access_dimension_summaries" (
  "id" TEXT NOT NULL,
  "place_id" TEXT NOT NULL,
  "category" "AccessRatingCategory" NOT NULL,
  "adjusted_rating" DOUBLE PRECISION,
  "raw_response_count" INTEGER NOT NULL DEFAULT 0,
  "unique_contributor_count" INTEGER NOT NULL DEFAULT 0,
  "recent_contributor_count" INTEGER NOT NULL DEFAULT 0,
  "last_confirmed_at" TIMESTAMP(3),
  "evidence_count" INTEGER NOT NULL DEFAULT 0,
  "conflict_count" INTEGER NOT NULL DEFAULT 0,
  "confidence_state" "AccessCommunityConfidence" NOT NULL DEFAULT 'limited',
  "reason_codes" JSONB,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "access_dimension_summaries_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "access_dimension_summaries_place_id_category_key" ON "access_dimension_summaries"("place_id", "category");
CREATE INDEX IF NOT EXISTS "access_dimension_summaries_place_id_idx" ON "access_dimension_summaries"("place_id");
ALTER TABLE "access_dimension_summaries" DROP CONSTRAINT IF EXISTS "access_dimension_summaries_place_id_fkey";
ALTER TABLE "access_dimension_summaries" ADD CONSTRAINT "access_dimension_summaries_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "access_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "access_review_feature_tags" (
  "id" TEXT NOT NULL,
  "review_id" TEXT NOT NULL,
  "tag_key" TEXT NOT NULL,
  "sentiment" "AccessTagSentiment" NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "access_review_feature_tags_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "access_review_feature_tags_review_id_tag_key_key" ON "access_review_feature_tags"("review_id", "tag_key");
CREATE INDEX IF NOT EXISTS "access_review_feature_tags_tag_key_idx" ON "access_review_feature_tags"("tag_key");
ALTER TABLE "access_review_feature_tags" DROP CONSTRAINT IF EXISTS "access_review_feature_tags_review_id_fkey";
ALTER TABLE "access_review_feature_tags" ADD CONSTRAINT "access_review_feature_tags_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "access_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "access_place_comments" (
  "id" TEXT NOT NULL,
  "place_id" TEXT NOT NULL,
  "review_id" TEXT,
  "parent_comment_id" TEXT,
  "author_user_id" TEXT NOT NULL,
  "author_role" TEXT,
  "feature_key" "AccessFeatureAnchor" NOT NULL DEFAULT 'whole_place',
  "comment_type" "AccessCommentType" NOT NULL,
  "body" TEXT NOT NULL,
  "status" "AccessCommentStatus" NOT NULL DEFAULT 'published',
  "moderation_status" "AccessModerationStatus" NOT NULL DEFAULT 'pending',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "resolved_at" TIMESTAMP(3),
  "resolved_by" TEXT,
  "edited_at" TIMESTAMP(3),
  CONSTRAINT "access_place_comments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "access_place_comments_place_id_created_at_idx" ON "access_place_comments"("place_id", "created_at");
CREATE INDEX IF NOT EXISTS "access_place_comments_review_id_idx" ON "access_place_comments"("review_id");
ALTER TABLE "access_place_comments" DROP CONSTRAINT IF EXISTS "access_place_comments_place_id_fkey";
ALTER TABLE "access_place_comments" ADD CONSTRAINT "access_place_comments_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "access_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "access_place_comments" DROP CONSTRAINT IF EXISTS "access_place_comments_review_id_fkey";
ALTER TABLE "access_place_comments" ADD CONSTRAINT "access_place_comments_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "access_reviews"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "access_place_comments" DROP CONSTRAINT IF EXISTS "access_place_comments_parent_comment_id_fkey";
ALTER TABLE "access_place_comments" ADD CONSTRAINT "access_place_comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "access_place_comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "access_place_comments" DROP CONSTRAINT IF EXISTS "access_place_comments_author_user_id_fkey";
ALTER TABLE "access_place_comments" ADD CONSTRAINT "access_place_comments_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "access_evidence_links" (
  "id" TEXT NOT NULL,
  "review_id" TEXT,
  "comment_id" TEXT,
  "photo_id" TEXT,
  "document_id" TEXT,
  "evidence_type" "AccessEvidenceType" NOT NULL,
  "alt_text" TEXT,
  "measurement_type" TEXT,
  "measurement_value" DOUBLE PRECISION,
  "measurement_unit" TEXT,
  "observation_date" TIMESTAMP(3),
  "provenance_type" "AccessEvidenceProvenance" NOT NULL DEFAULT 'community',
  "verification_status" "AccessEvidenceVerification" NOT NULL DEFAULT 'unverified',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "access_evidence_links_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "access_evidence_links_review_id_idx" ON "access_evidence_links"("review_id");
CREATE INDEX IF NOT EXISTS "access_evidence_links_comment_id_idx" ON "access_evidence_links"("comment_id");
ALTER TABLE "access_evidence_links" DROP CONSTRAINT IF EXISTS "access_evidence_links_review_id_fkey";
ALTER TABLE "access_evidence_links" ADD CONSTRAINT "access_evidence_links_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "access_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "access_evidence_links" DROP CONSTRAINT IF EXISTS "access_evidence_links_comment_id_fkey";
ALTER TABLE "access_evidence_links" ADD CONSTRAINT "access_evidence_links_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "access_place_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "access_reactions" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "target_type" "AccessReactionTargetType" NOT NULL,
  "target_id" TEXT NOT NULL,
  "reaction_type" "AccessReactionType" NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "cleared_at" TIMESTAMP(3),
  CONSTRAINT "access_reactions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "access_reactions_user_id_target_type_target_id_reaction_type_key" ON "access_reactions"("user_id", "target_type", "target_id", "reaction_type");
CREATE INDEX IF NOT EXISTS "access_reactions_target_type_target_id_idx" ON "access_reactions"("target_type", "target_id");
ALTER TABLE "access_reactions" DROP CONSTRAINT IF EXISTS "access_reactions_user_id_fkey";
ALTER TABLE "access_reactions" ADD CONSTRAINT "access_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "access_place_alerts" (
  "id" TEXT NOT NULL,
  "place_id" TEXT NOT NULL,
  "author_user_id" TEXT,
  "feature_key" "AccessFeatureAnchor" NOT NULL DEFAULT 'whole_place',
  "title" TEXT NOT NULL,
  "body" TEXT,
  "observation_date" TIMESTAMP(3) NOT NULL,
  "expected_expiry" TIMESTAMP(3),
  "source_type" TEXT NOT NULL DEFAULT 'community',
  "status" "AccessAlertStatus" NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "access_place_alerts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "access_place_alerts_place_id_status_idx" ON "access_place_alerts"("place_id", "status");
ALTER TABLE "access_place_alerts" DROP CONSTRAINT IF EXISTS "access_place_alerts_place_id_fkey";
ALTER TABLE "access_place_alerts" ADD CONSTRAINT "access_place_alerts_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "access_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "access_place_alerts" DROP CONSTRAINT IF EXISTS "access_place_alerts_author_user_id_fkey";
ALTER TABLE "access_place_alerts" ADD CONSTRAINT "access_place_alerts_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "access_issue_history" (
  "id" TEXT NOT NULL,
  "place_id" TEXT NOT NULL,
  "review_id" TEXT,
  "comment_id" TEXT,
  "alert_id" TEXT,
  "state" "AccessIssueHistoryState" NOT NULL,
  "actor_id" TEXT,
  "note" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "access_issue_history_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "access_issue_history_place_id_created_at_idx" ON "access_issue_history"("place_id", "created_at");
ALTER TABLE "access_issue_history" DROP CONSTRAINT IF EXISTS "access_issue_history_place_id_fkey";
ALTER TABLE "access_issue_history" ADD CONSTRAINT "access_issue_history_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "access_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "access_issue_history" DROP CONSTRAINT IF EXISTS "access_issue_history_actor_id_fkey";
ALTER TABLE "access_issue_history" ADD CONSTRAINT "access_issue_history_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "access_contribution_ledger" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "contribution_type" TEXT NOT NULL,
  "source_entity_type" TEXT NOT NULL,
  "source_entity_id" TEXT NOT NULL,
  "points" INTEGER NOT NULL,
  "reason_code" TEXT NOT NULL,
  "status" "AccessContributionStatus" NOT NULL DEFAULT 'pending',
  "awarded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reversed_at" TIMESTAMP(3),
  "idempotency_key" TEXT NOT NULL,
  "moderation_reference" TEXT,
  CONSTRAINT "access_contribution_ledger_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "access_contribution_ledger_idempotency_key_key" ON "access_contribution_ledger"("idempotency_key");
CREATE INDEX IF NOT EXISTS "access_contribution_ledger_user_id_awarded_at_idx" ON "access_contribution_ledger"("user_id", "awarded_at");
CREATE INDEX IF NOT EXISTS "access_contribution_ledger_source_entity_type_source_entity_id_idx" ON "access_contribution_ledger"("source_entity_type", "source_entity_id");
ALTER TABLE "access_contribution_ledger" DROP CONSTRAINT IF EXISTS "access_contribution_ledger_user_id_fkey";
ALTER TABLE "access_contribution_ledger" ADD CONSTRAINT "access_contribution_ledger_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "access_badge_definitions" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "access_badge_definitions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "access_badge_definitions_key_key" ON "access_badge_definitions"("key");

CREATE TABLE IF NOT EXISTS "access_user_badges" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "badge_key" TEXT NOT NULL,
  "awarded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB,
  CONSTRAINT "access_user_badges_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "access_user_badges_user_id_badge_key_key" ON "access_user_badges"("user_id", "badge_key");
ALTER TABLE "access_user_badges" DROP CONSTRAINT IF EXISTS "access_user_badges_user_id_fkey";
ALTER TABLE "access_user_badges" ADD CONSTRAINT "access_user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "access_user_badges" DROP CONSTRAINT IF EXISTS "access_user_badges_badge_key_fkey";
ALTER TABLE "access_user_badges" ADD CONSTRAINT "access_user_badges_badge_key_fkey" FOREIGN KEY ("badge_key") REFERENCES "access_badge_definitions"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "access_contribution_privacy" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "hide_points_publicly" BOOLEAN NOT NULL DEFAULT false,
  "hide_badges_publicly" BOOLEAN NOT NULL DEFAULT false,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "access_contribution_privacy_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "access_contribution_privacy_user_id_key" ON "access_contribution_privacy"("user_id");
ALTER TABLE "access_contribution_privacy" DROP CONSTRAINT IF EXISTS "access_contribution_privacy_user_id_fkey";
ALTER TABLE "access_contribution_privacy" ADD CONSTRAINT "access_contribution_privacy_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "access_mapping_challenges" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "plain_language_description" TEXT NOT NULL,
  "geographic_scope" TEXT,
  "target_feature" TEXT,
  "starts_at" TIMESTAMP(3) NOT NULL,
  "ends_at" TIMESTAMP(3) NOT NULL,
  "contribution_rules" JSONB,
  "target_count" INTEGER NOT NULL DEFAULT 0,
  "visibility" TEXT NOT NULL DEFAULT 'public',
  "status" "AccessMappingChallengeStatus" NOT NULL DEFAULT 'draft',
  "created_by" TEXT NOT NULL,
  "moderation_required" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "access_mapping_challenges_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "access_mapping_challenges_status_starts_at_ends_at_idx" ON "access_mapping_challenges"("status", "starts_at", "ends_at");
ALTER TABLE "access_mapping_challenges" DROP CONSTRAINT IF EXISTS "access_mapping_challenges_created_by_fkey";
ALTER TABLE "access_mapping_challenges" ADD CONSTRAINT "access_mapping_challenges_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "access_challenge_progress" (
  "id" TEXT NOT NULL,
  "challenge_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "completed_at" TIMESTAMP(3),
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "access_challenge_progress_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "access_challenge_progress_challenge_id_user_id_key" ON "access_challenge_progress"("challenge_id", "user_id");
ALTER TABLE "access_challenge_progress" DROP CONSTRAINT IF EXISTS "access_challenge_progress_challenge_id_fkey";
ALTER TABLE "access_challenge_progress" ADD CONSTRAINT "access_challenge_progress_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "access_mapping_challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "access_challenge_progress" DROP CONSTRAINT IF EXISTS "access_challenge_progress_user_id_fkey";
ALTER TABLE "access_challenge_progress" ADD CONSTRAINT "access_challenge_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
