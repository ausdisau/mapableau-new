-- Participant dashboard support tables (saved providers, worker preferences)

CREATE TABLE IF NOT EXISTS "saved_providers" (
  "id" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "providerName" TEXT NOT NULL,
  "providerSlug" TEXT,
  "providerRefId" TEXT,
  "source" TEXT NOT NULL DEFAULT 'directory',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "saved_providers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "saved_providers_participantId_idx"
  ON "saved_providers"("participantId");

CREATE TABLE IF NOT EXISTS "participant_worker_preferences" (
  "id" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "workerUserId" TEXT NOT NULL,
  "label" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "participant_worker_preferences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "participant_worker_preferences_participantId_workerUserId_key"
  ON "participant_worker_preferences"("participantId", "workerUserId");

CREATE INDEX IF NOT EXISTS "participant_worker_preferences_participantId_idx"
  ON "participant_worker_preferences"("participantId");
