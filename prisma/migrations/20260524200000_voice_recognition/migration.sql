-- Voice recognition layer

CREATE TYPE "VoiceDraftType" AS ENUM ('care_request', 'transport_trip', 'care_transport_bundle', 'provider_message', 'service_log', 'incident_draft', 'search_query');
CREATE TYPE "VoiceSessionStatus" AS ENUM ('created', 'recording', 'transcribing', 'review', 'completed', 'discarded', 'error');
CREATE TYPE "VoiceTranscriptStatus" AS ENUM ('pending_review', 'confirmed', 'discarded');
CREATE TYPE "VoiceIntentDraftStatus" AS ENUM ('draft', 'applied', 'discarded');
CREATE TYPE "VoiceAudioRetention" AS ENUM ('ephemeral', 'consented_storage');
CREATE TYPE "VoiceAdapterKind" AS ENUM ('mock', 'speaches', 'faster_whisper', 'whisper_cpp', 'vosk');
CREATE TYPE "VoiceEventType" AS ENUM ('session_created', 'recording_started', 'recording_stopped', 'transcription_started', 'transcription_completed', 'transcription_failed', 'transcript_edited', 'transcript_confirmed', 'transcript_discarded', 'draft_created', 'draft_discarded', 'audio_deleted', 'preference_updated');

CREATE TABLE "VoiceSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organisationId" TEXT,
    "intendedDraftType" "VoiceDraftType" NOT NULL,
    "status" "VoiceSessionStatus" NOT NULL DEFAULT 'created',
    "adapterUsed" "VoiceAdapterKind",
    "audioRetention" "VoiceAudioRetention" NOT NULL DEFAULT 'ephemeral',
    "audioFileKey" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VoiceSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VoiceTranscript" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "rawTranscript" TEXT NOT NULL,
    "editedTranscript" TEXT,
    "confidence" DOUBLE PRECISION,
    "language" TEXT,
    "status" "VoiceTranscriptStatus" NOT NULL DEFAULT 'pending_review',
    "adapterUsed" "VoiceAdapterKind",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VoiceTranscript_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VoiceIntentDraft" (
    "id" TEXT NOT NULL,
    "transcriptId" TEXT NOT NULL,
    "draftType" "VoiceDraftType" NOT NULL,
    "draftPayloadJson" JSONB NOT NULL,
    "status" "VoiceIntentDraftStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VoiceIntentDraft_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VoiceEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "transcriptId" TEXT,
    "userId" TEXT NOT NULL,
    "eventType" "VoiceEventType" NOT NULL,
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VoiceEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VoiceUserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "voiceEnabled" BOOLEAN NOT NULL DEFAULT true,
    "preferredAdapter" "VoiceAdapterKind",
    "consentThirdPartyStt" BOOLEAN NOT NULL DEFAULT false,
    "storeAudioAfterTranscribe" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VoiceUserPreference_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VoiceUserPreference_userId_key" ON "VoiceUserPreference"("userId");
CREATE INDEX "VoiceSession_userId_createdAt_idx" ON "VoiceSession"("userId", "createdAt");
CREATE INDEX "VoiceTranscript_sessionId_idx" ON "VoiceTranscript"("sessionId");
CREATE INDEX "VoiceIntentDraft_transcriptId_idx" ON "VoiceIntentDraft"("transcriptId");
CREATE INDEX "VoiceEvent_sessionId_createdAt_idx" ON "VoiceEvent"("sessionId", "createdAt");
CREATE INDEX "VoiceEvent_userId_createdAt_idx" ON "VoiceEvent"("userId", "createdAt");

ALTER TABLE "VoiceSession" ADD CONSTRAINT "VoiceSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VoiceTranscript" ADD CONSTRAINT "VoiceTranscript_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "VoiceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VoiceIntentDraft" ADD CONSTRAINT "VoiceIntentDraft_transcriptId_fkey" FOREIGN KEY ("transcriptId") REFERENCES "VoiceTranscript"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VoiceEvent" ADD CONSTRAINT "VoiceEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "VoiceSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "VoiceEvent" ADD CONSTRAINT "VoiceEvent_transcriptId_fkey" FOREIGN KEY ("transcriptId") REFERENCES "VoiceTranscript"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "VoiceEvent" ADD CONSTRAINT "VoiceEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VoiceUserPreference" ADD CONSTRAINT "VoiceUserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
