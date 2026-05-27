-- Repair WorkerProfile stub after migration-history drift (empty table only).
-- Safe when WorkerProfile has no rows.

CREATE TYPE "WorkerCredentialStatus" AS ENUM (
  'not_provided',
  'pending_review',
  'verified',
  'expired',
  'rejected'
);

DROP TABLE IF EXISTS "WorkerProfile" CASCADE;

CREATE TABLE "WorkerProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "organisationId" TEXT NOT NULL,
  "legacyWorkerId" TEXT,
  "displayName" TEXT NOT NULL,
  "profileSummary" TEXT,
  "serviceTypes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "serviceRegions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "specialisations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "languages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "communicationCapabilities" JSONB NOT NULL DEFAULT '[]',
  "qualificationsSummary" TEXT,
  "workerScreeningStatus" "WorkerCredentialStatus" NOT NULL DEFAULT 'not_provided',
  "wwccStatus" "WorkerCredentialStatus" NOT NULL DEFAULT 'not_provided',
  "firstAidStatus" "WorkerCredentialStatus" NOT NULL DEFAULT 'not_provided',
  "insuranceStatus" "WorkerCredentialStatus" NOT NULL DEFAULT 'not_provided',
  "verificationStatus" "WorkerCredentialStatus" NOT NULL DEFAULT 'pending_review',
  "highIntensityCompetencyVerified" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WorkerProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkerProfile_legacyWorkerId_key"
  ON "WorkerProfile"("legacyWorkerId")
  WHERE "legacyWorkerId" IS NOT NULL;

CREATE UNIQUE INDEX "WorkerProfile_userId_organisationId_key"
  ON "WorkerProfile"("userId", "organisationId")
  WHERE "userId" IS NOT NULL;

CREATE INDEX "WorkerProfile_organisationId_active_idx"
  ON "WorkerProfile"("organisationId", "active");

ALTER TABLE "WorkerProfile"
  ADD CONSTRAINT "WorkerProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WorkerProfile"
  ADD CONSTRAINT "WorkerProfile_organisationId_fkey"
  FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TYPE "OrganisationType" ADD VALUE IF NOT EXISTS 'independent_support_worker';

ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "organisationId" TEXT;
CREATE INDEX IF NOT EXISTS "Provider_organisationId_idx" ON "Provider"("organisationId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Provider_organisationId_fkey'
  ) THEN
    ALTER TABLE "Provider"
      ADD CONSTRAINT "Provider_organisationId_fkey"
      FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
