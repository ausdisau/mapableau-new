-- Support worker search & matching tables

CREATE TYPE "WorkerMatchEventType" AS ENUM (
  'search',
  'match_run',
  'save_preferred',
  'hide',
  'reject',
  'request_more',
  'select'
);

ALTER TYPE "MatchFactorType" ADD VALUE IF NOT EXISTS 'qualification_fit';
ALTER TYPE "MatchFactorType" ADD VALUE IF NOT EXISTS 'availability_fit';
ALTER TYPE "MatchFactorType" ADD VALUE IF NOT EXISTS 'location_fit';
ALTER TYPE "MatchFactorType" ADD VALUE IF NOT EXISTS 'preference_fit';
ALTER TYPE "MatchFactorType" ADD VALUE IF NOT EXISTS 'continuity_of_support';
ALTER TYPE "MatchFactorType" ADD VALUE IF NOT EXISTS 'communication_fit';
ALTER TYPE "MatchFactorType" ADD VALUE IF NOT EXISTS 'reliability_fit';
ALTER TYPE "MatchFactorType" ADD VALUE IF NOT EXISTS 'risk_penalty';

CREATE TABLE "worker_match_profiles" (
    "id" TEXT NOT NULL,
    "workerProfileId" TEXT NOT NULL,
    "capabilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "behaviourSupportPlanTrained" BOOLEAN NOT NULL DEFAULT false,
    "gender" TEXT,
    "maxTravelRadiusKm" INTEGER NOT NULL DEFAULT 50,
    "communicationModes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reliabilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "cancellationRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastIncidentAt" TIMESTAMP(3),
    "hasUnresolvedIncident" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "worker_match_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "participant_match_preferences" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "preferredWorkerIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "blockedWorkerIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hiddenWorkerIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredGender" TEXT,
    "preferredLanguages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredCommunicationModes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "maxDistanceKm" INTEGER NOT NULL DEFAULT 40,
    "continuityPreferred" BOOLEAN NOT NULL DEFAULT true,
    "requiresBehaviourSupportPlan" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "participant_match_preferences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "worker_availability_windows" (
    "id" TEXT NOT NULL,
    "workerProfileId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Australia/Sydney',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "worker_availability_windows_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "worker_match_events" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "workerProfileId" TEXT NOT NULL,
    "eventType" "WorkerMatchEventType" NOT NULL,
    "matchRunId" TEXT,
    "supportRequestSnapshot" JSONB,
    "resultSnapshot" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "worker_match_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "worker_match_profiles_workerProfileId_key" ON "worker_match_profiles"("workerProfileId");
CREATE UNIQUE INDEX "participant_match_preferences_participantId_key" ON "participant_match_preferences"("participantId");
CREATE INDEX "worker_availability_windows_workerProfileId_startsAt_endsAt_idx" ON "worker_availability_windows"("workerProfileId", "startsAt", "endsAt");
CREATE INDEX "worker_match_events_participantId_createdAt_idx" ON "worker_match_events"("participantId", "createdAt");
CREATE INDEX "worker_match_events_workerProfileId_idx" ON "worker_match_events"("workerProfileId");
CREATE INDEX "worker_match_events_matchRunId_idx" ON "worker_match_events"("matchRunId");

ALTER TABLE "worker_match_profiles" ADD CONSTRAINT "worker_match_profiles_workerProfileId_fkey" FOREIGN KEY ("workerProfileId") REFERENCES "WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "participant_match_preferences" ADD CONSTRAINT "participant_match_preferences_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "worker_availability_windows" ADD CONSTRAINT "worker_availability_windows_workerProfileId_fkey" FOREIGN KEY ("workerProfileId") REFERENCES "WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "worker_match_events" ADD CONSTRAINT "worker_match_events_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "worker_match_events" ADD CONSTRAINT "worker_match_events_workerProfileId_fkey" FOREIGN KEY ("workerProfileId") REFERENCES "WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "worker_match_events" ADD CONSTRAINT "worker_match_events_matchRunId_fkey" FOREIGN KEY ("matchRunId") REFERENCES "MatchRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill worker_match_profiles from active WorkerProfile rows
INSERT INTO "worker_match_profiles" (
    "id",
    "workerProfileId",
    "capabilities",
    "communicationModes",
    "reliabilityScore",
    "updatedAt"
)
SELECT
    gen_random_uuid()::text,
    wp."id",
    ARRAY[]::TEXT[],
    ARRAY[]::TEXT[],
    0.8,
    CURRENT_TIMESTAMP
FROM "WorkerProfile" wp
WHERE wp."active" = true
  AND NOT EXISTS (
    SELECT 1 FROM "worker_match_profiles" wmp WHERE wmp."workerProfileId" = wp."id"
  );
