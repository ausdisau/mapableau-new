-- MapAble Provider directory (coexists with legacy public schema tables).
-- Safe to re-run: uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS.

DO $$ BEGIN
  CREATE TYPE "DayOfWeek" AS ENUM (
    'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Provider" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "logoUrl" TEXT,
  "description" TEXT,
  "website" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "abn" TEXT,
  "businessType" TEXT,
  "ndisRegistered" BOOLEAN NOT NULL DEFAULT false,
  "ndisNumber" TEXT,
  "rating" DOUBLE PRECISION,
  "reviewCount" INTEGER NOT NULL DEFAULT 0,
  "serviceAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "specialisations" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "slug" TEXT,
  "outletKey" TEXT,
  "source" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "abn" TEXT;
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "businessType" TEXT;
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "rating" DOUBLE PRECISION;
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "reviewCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "serviceAreas" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "specialisations" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "slug" TEXT;
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "outletKey" TEXT;
ALTER TABLE "Provider" ADD COLUMN IF NOT EXISTS "source" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Provider_slug_key" ON "Provider"("slug") WHERE "slug" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Provider_outletKey_key" ON "Provider"("outletKey") WHERE "outletKey" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "ServiceLocation" (
  "id" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "city" TEXT,
  "state" TEXT,
  "postcode" TEXT,
  "country" TEXT,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "providerId" TEXT NOT NULL,
  CONSTRAINT "ServiceLocation_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ServiceLocation" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
ALTER TABLE "ServiceLocation" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;

DO $$ BEGIN
  ALTER TABLE "ServiceLocation"
    ADD CONSTRAINT "ServiceLocation_providerId_fkey"
    FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "ServiceLocation_providerId_idx" ON "ServiceLocation"("providerId");
