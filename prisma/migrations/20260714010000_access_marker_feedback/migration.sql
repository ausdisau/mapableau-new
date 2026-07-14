-- CreateEnum
CREATE TYPE "AccessMarkerContentStatus" AS ENUM ('published', 'needs_review', 'hidden', 'disputed', 'archived');

-- CreateEnum
CREATE TYPE "AccessMarkerCommentType" AS ENUM ('general', 'mobility', 'toilet', 'parking', 'sensory', 'communication', 'staff_service', 'temporary_alert', 'transport_dropoff', 'correction');

-- CreateEnum
CREATE TYPE "AccessMarkerVerificationAction" AS ENUM ('confirm_accurate', 'mark_outdated', 'dispute', 'resolve_alert', 'suggest_evidence');

-- CreateEnum
CREATE TYPE "AccessMobilityAidType" AS ENUM ('manual_wheelchair', 'powerchair', 'mobility_scooter', 'walker', 'cane', 'other');

-- CreateTable
CREATE TABLE "access_marker_ratings" (
    "id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "overall_rating" INTEGER,
    "mobility_rating" INTEGER,
    "toilet_rating" INTEGER,
    "parking_dropoff_rating" INTEGER,
    "sensory_rating" INTEGER,
    "communication_rating" INTEGER,
    "staff_service_rating" INTEGER,
    "visited_at" TIMESTAMP(3),
    "visited_in_person" BOOLEAN NOT NULL DEFAULT true,
    "used_mobility_aid" BOOLEAN,
    "mobility_aid_type" "AccessMobilityAidType",
    "status" "AccessMarkerContentStatus" NOT NULL DEFAULT 'published',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_marker_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_marker_comments" (
    "id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rating_id" TEXT,
    "comment_type" "AccessMarkerCommentType" NOT NULL,
    "body" TEXT NOT NULL,
    "evidence_photo_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "AccessMarkerContentStatus" NOT NULL DEFAULT 'published',
    "moderation_flags" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_marker_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_marker_aggregate_scores" (
    "id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "overall_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mobility_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "toilet_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "parking_dropoff_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sensory_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "communication_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "staff_service_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confidence_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "comment_count" INTEGER NOT NULL DEFAULT 0,
    "verified_count" INTEGER NOT NULL DEFAULT 0,
    "disputed_count" INTEGER NOT NULL DEFAULT 0,
    "last_rated_at" TIMESTAMP(3),
    "last_verified_at" TIMESTAMP(3),
    "last_checked_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_marker_aggregate_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_marker_verifications" (
    "id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" "AccessMarkerVerificationAction" NOT NULL,
    "note" TEXT,
    "comment_id" TEXT,
    "evidence_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_marker_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "access_marker_ratings_place_id_status_idx" ON "access_marker_ratings"("place_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "access_marker_ratings_place_id_user_id_key" ON "access_marker_ratings"("place_id", "user_id");

-- CreateIndex
CREATE INDEX "access_marker_comments_place_id_status_created_at_idx" ON "access_marker_comments"("place_id", "status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "access_marker_aggregate_scores_place_id_key" ON "access_marker_aggregate_scores"("place_id");

-- CreateIndex
CREATE INDEX "access_marker_verifications_place_id_action_created_at_idx" ON "access_marker_verifications"("place_id", "action", "created_at");

-- AddForeignKey
ALTER TABLE "access_marker_ratings" ADD CONSTRAINT "access_marker_ratings_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "access_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_marker_ratings" ADD CONSTRAINT "access_marker_ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_marker_comments" ADD CONSTRAINT "access_marker_comments_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "access_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_marker_comments" ADD CONSTRAINT "access_marker_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_marker_comments" ADD CONSTRAINT "access_marker_comments_rating_id_fkey" FOREIGN KEY ("rating_id") REFERENCES "access_marker_ratings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_marker_aggregate_scores" ADD CONSTRAINT "access_marker_aggregate_scores_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "access_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_marker_verifications" ADD CONSTRAINT "access_marker_verifications_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "access_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_marker_verifications" ADD CONSTRAINT "access_marker_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
