-- AlterEnum
ALTER TYPE "TransportRoutingProvider" ADD VALUE IF NOT EXISTS 'tomtom';
ALTER TYPE "ConsentScope" ADD VALUE IF NOT EXISTS 'transport_driver_location_share';

-- AlterTable
ALTER TABLE "transport_dispatch_assignments"
  ADD COLUMN IF NOT EXISTS "driverLocationShareOptedIn" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "transport_route_estimates"
  ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "source" TEXT,
  ADD COLUMN IF NOT EXISTS "trafficMode" TEXT,
  ADD COLUMN IF NOT EXISTS "liveTrafficUsed" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "providerStatus" TEXT NOT NULL DEFAULT 'ok',
  ADD COLUMN IF NOT EXISTS "fallbackReason" TEXT,
  ADD COLUMN IF NOT EXISTS "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "geometryJson" JSONB,
  ADD COLUMN IF NOT EXISTS "boardingBufferSeconds" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "travelDurationSeconds" INTEGER,
  ADD COLUMN IF NOT EXISTS "hazardEvidence" JSONB;

CREATE INDEX IF NOT EXISTS "transport_route_estimates_cacheKey_expiresAt_idx"
  ON "transport_route_estimates"("cacheKey", "expiresAt");

CREATE TABLE IF NOT EXISTS "transport_routing_daily_usage" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "dayUtc" TEXT NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "transport_routing_daily_usage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "transport_routing_daily_usage_provider_dayUtc_key"
  ON "transport_routing_daily_usage"("provider", "dayUtc");
