-- CreateEnum
CREATE TYPE "AccessAlertSeverity" AS ENUM ('info', 'caution', 'disruption');

-- CreateEnum
CREATE TYPE "AccessAlertStatus" AS ENUM ('active', 'resolved');

-- CreateTable
CREATE TABLE "access_place_alerts" (
    "id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "severity" "AccessAlertSeverity" NOT NULL DEFAULT 'caution',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "AccessAlertStatus" NOT NULL DEFAULT 'active',
    "source" TEXT NOT NULL DEFAULT 'community',
    "starts_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ends_at" TIMESTAMP(3),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_place_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_saved_places" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_saved_places_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_chat_feedback" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "session_id" TEXT NOT NULL,
    "message_id" TEXT,
    "rating" TEXT NOT NULL,
    "comment" TEXT,
    "intent_snapshot" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_chat_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_chat_profile_consents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "consented_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_chat_profile_consents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "access_place_alerts_place_id_status_idx" ON "access_place_alerts"("place_id", "status");

-- CreateIndex
CREATE INDEX "access_saved_places_user_id_idx" ON "access_saved_places"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "access_saved_places_user_id_place_id_key" ON "access_saved_places"("user_id", "place_id");

-- CreateIndex
CREATE INDEX "access_chat_feedback_session_id_idx" ON "access_chat_feedback"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "access_chat_profile_consents_user_id_key" ON "access_chat_profile_consents"("user_id");

-- AddForeignKey
ALTER TABLE "access_place_alerts" ADD CONSTRAINT "access_place_alerts_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "access_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_place_alerts" ADD CONSTRAINT "access_place_alerts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_saved_places" ADD CONSTRAINT "access_saved_places_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_saved_places" ADD CONSTRAINT "access_saved_places_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "access_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_chat_feedback" ADD CONSTRAINT "access_chat_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_chat_profile_consents" ADD CONSTRAINT "access_chat_profile_consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
