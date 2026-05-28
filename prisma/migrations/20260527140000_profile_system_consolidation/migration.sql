-- Profile system consolidation: Provider↔Organisation bridge, WorkerProfile extensions

-- OrganisationType: independent_support_worker
ALTER TYPE "OrganisationType" ADD VALUE IF NOT EXISTS 'independent_support_worker';

-- Provider.organisationId
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

-- WorkerProfile extensions
ALTER TABLE "WorkerProfile" ADD COLUMN IF NOT EXISTS "legacyWorkerId" TEXT;
ALTER TABLE "WorkerProfile" ADD COLUMN IF NOT EXISTS "specialisations" TEXT[] DEFAULT ARRAY[]::TEXT[];

CREATE UNIQUE INDEX IF NOT EXISTS "WorkerProfile_legacyWorkerId_key"
  ON "WorkerProfile"("legacyWorkerId") WHERE "legacyWorkerId" IS NOT NULL;

-- One profile per user per organisation (dedupe before unique constraint)
DELETE FROM "WorkerProfile" wp1
USING "WorkerProfile" wp2
WHERE wp1."userId" IS NOT NULL
  AND wp1."userId" = wp2."userId"
  AND wp1."organisationId" = wp2."organisationId"
  AND (
    wp1."createdAt" > wp2."createdAt"
    OR (wp1."createdAt" = wp2."createdAt" AND wp1."id" > wp2."id")
  );

CREATE UNIQUE INDEX IF NOT EXISTS "WorkerProfile_userId_organisationId_key"
  ON "WorkerProfile"("userId", "organisationId")
  WHERE "userId" IS NOT NULL;
