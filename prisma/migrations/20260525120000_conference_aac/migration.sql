-- Conference sessions + AAC phrases

CREATE TYPE "ConferenceMode" AS ENUM ('audio', 'video');
CREATE TYPE "ConferenceProvider" AS ENUM ('daily', 'livekit', 'twilio', 'mock');
CREATE TYPE "ConferenceSessionStatus" AS ENUM ('scheduled', 'active', 'ended');

CREATE TABLE "conference_sessions" (
  "id" TEXT NOT NULL,
  "thread_id" TEXT NOT NULL,
  "mode" "ConferenceMode" NOT NULL,
  "provider" "ConferenceProvider" NOT NULL DEFAULT 'daily',
  "external_room_id" TEXT NOT NULL,
  "status" "ConferenceSessionStatus" NOT NULL DEFAULT 'active',
  "created_by" TEXT NOT NULL,
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ended_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "conference_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "conference_participants" (
  "id" TEXT NOT NULL,
  "session_id" TEXT NOT NULL,
  "profile_id" TEXT NOT NULL,
  "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "left_at" TIMESTAMP(3),
  CONSTRAINT "conference_participants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "aac_phrases" (
  "id" TEXT NOT NULL,
  "profile_id" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "phrase" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'custom',
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "aac_phrases_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "conference_participants_session_id_profile_id_key" ON "conference_participants"("session_id", "profile_id");
CREATE INDEX "conference_sessions_thread_id_status_idx" ON "conference_sessions"("thread_id", "status");
CREATE INDEX "conference_sessions_created_by_idx" ON "conference_sessions"("created_by");
CREATE INDEX "conference_participants_profile_id_idx" ON "conference_participants"("profile_id");
CREATE INDEX "aac_phrases_profile_id_sort_order_idx" ON "aac_phrases"("profile_id", "sort_order");

ALTER TABLE "conference_sessions" ADD CONSTRAINT "conference_sessions_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "conversation_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conference_sessions" ADD CONSTRAINT "conference_sessions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "conference_participants" ADD CONSTRAINT "conference_participants_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "conference_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conference_participants" ADD CONSTRAINT "conference_participants_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "aac_phrases" ADD CONSTRAINT "aac_phrases_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
