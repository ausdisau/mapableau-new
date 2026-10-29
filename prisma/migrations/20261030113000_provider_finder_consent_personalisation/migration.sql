-- Additive: participant-controlled chat search preferences and worker directory opt-in.
-- This migration must be tested on an isolated Neon branch before production deployment.
CREATE TABLE "provider_finder_preferences" (
  "userId" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT FALSE,
  "location" TEXT,
  "supportType" TEXT,
  "language" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "provider_finder_preferences_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE "worker_directory_publications" (
  "workerProfileId" TEXT NOT NULL,
  "published" BOOLEAN NOT NULL DEFAULT FALSE,
  "consentedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "worker_directory_publications_pkey" PRIMARY KEY ("workerProfileId")
);

CREATE INDEX "worker_directory_publications_published_idx"
  ON "worker_directory_publications"("published");

ALTER TABLE "provider_finder_preferences"
  ADD CONSTRAINT "provider_finder_preferences_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "worker_directory_publications"
  ADD CONSTRAINT "worker_directory_publications_workerProfileId_fkey"
  FOREIGN KEY ("workerProfileId") REFERENCES "WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
