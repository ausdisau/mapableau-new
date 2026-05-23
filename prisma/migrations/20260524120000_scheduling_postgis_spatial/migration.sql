-- MapAble OSM scheduling: PostGIS + spatial location models

CREATE EXTENSION IF NOT EXISTS postgis;

-- RoutePlan extensions
ALTER TABLE "RoutePlan" ADD COLUMN IF NOT EXISTS "geometryGeoJson" JSONB;
ALTER TABLE "RoutePlan" ADD COLUMN IF NOT EXISTS "totalDurationSeconds" INTEGER;
ALTER TABLE "RoutePlan" ADD COLUMN IF NOT EXISTS "totalDistanceMeters" INTEGER;

-- RouteStop extensions
ALTER TABLE "RouteStop" ADD COLUMN IF NOT EXISTS "lat" DOUBLE PRECISION;
ALTER TABLE "RouteStop" ADD COLUMN IF NOT EXISTS "lng" DOUBLE PRECISION;
ALTER TABLE "RouteStop" ADD COLUMN IF NOT EXISTS "participantLocationId" TEXT;
ALTER TABLE "RouteStop" ADD COLUMN IF NOT EXISTS "serviceSiteId" TEXT;

-- TravelTimeEstimate extensions
ALTER TABLE "TravelTimeEstimate" ADD COLUMN IF NOT EXISTS "fromStopId" TEXT;
ALTER TABLE "TravelTimeEstimate" ADD COLUMN IF NOT EXISTS "toStopId" TEXT;
ALTER TABLE "TravelTimeEstimate" ADD COLUMN IF NOT EXISTS "durationSeconds" INTEGER;
ALTER TABLE "TravelTimeEstimate" ADD COLUMN IF NOT EXISTS "distanceMeters" INTEGER;
ALTER TABLE "TravelTimeEstimate" ADD COLUMN IF NOT EXISTS "bufferMinutes" INTEGER NOT NULL DEFAULT 0;

-- TransportBooking location refs
ALTER TABLE "TransportBooking" ADD COLUMN IF NOT EXISTS "pickupParticipantLocationId" TEXT;
ALTER TABLE "TransportBooking" ADD COLUMN IF NOT EXISTS "dropoffParticipantLocationId" TEXT;

-- Enums
CREATE TYPE "LocationVisibility" AS ENUM ('private', 'provider_internal', 'public_site');
CREATE TYPE "ScheduledResourceType" AS ENUM ('worker', 'driver', 'vehicle');
CREATE TYPE "SchedulingEngineType" AS ENUM ('heuristic', 'ortools', 'timefold');
CREATE TYPE "TravelMatrixSource" AS ENUM ('openrouteservice', 'cached', 'haversine_fallback');

-- ServiceSite
CREATE TABLE "ServiceSite" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "addressPublic" TEXT,
    "suburb" TEXT,
    "state" TEXT,
    "postcode" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "capabilities" JSONB NOT NULL DEFAULT '{}',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ServiceSite_pkey" PRIMARY KEY ("id")
);

-- ParticipantLocation
CREATE TABLE "ParticipantLocation" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "suburb" TEXT,
    "state" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "visibility" "LocationVisibility" NOT NULL DEFAULT 'private',
    "isDefaultPickup" BOOLEAN NOT NULL DEFAULT false,
    "notesInternal" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ParticipantLocation_pkey" PRIMARY KEY ("id")
);

-- ScheduledAssignment
CREATE TABLE "ScheduledAssignment" (
    "id" TEXT NOT NULL,
    "resourceType" "ScheduledResourceType" NOT NULL,
    "resourceId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "bookingId" TEXT,
    "careShiftId" TEXT,
    "transportBookingId" TEXT,
    "organisationId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScheduledAssignment_pkey" PRIMARY KEY ("id")
);

-- ServiceLog
CREATE TABLE "ServiceLog" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT,
    "careShiftId" TEXT,
    "transportBookingId" TEXT,
    "participantId" TEXT NOT NULL,
    "organisationId" TEXT,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "deliveredSupports" JSONB NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ServiceLog_pkey" PRIMARY KEY ("id")
);

-- TravelTimeMatrixCache
CREATE TABLE "TravelTimeMatrixCache" (
    "id" TEXT NOT NULL,
    "fromLat" DOUBLE PRECISION NOT NULL,
    "fromLng" DOUBLE PRECISION NOT NULL,
    "toLat" DOUBLE PRECISION NOT NULL,
    "toLng" DOUBLE PRECISION NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "distanceMeters" INTEGER NOT NULL,
    "source" "TravelMatrixSource" NOT NULL DEFAULT 'openrouteservice',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TravelTimeMatrixCache_pkey" PRIMARY KEY ("id")
);

-- SchedulingRun
CREATE TABLE "SchedulingRun" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT,
    "bookingId" TEXT,
    "engine" "SchedulingEngineType" NOT NULL DEFAULT 'heuristic',
    "inputSnapshot" JSONB NOT NULL,
    "outputSnapshot" JSONB,
    "score" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SchedulingRun_pkey" PRIMARY KEY ("id")
);

-- PostGIS geography columns (synced from lat/lng via application or trigger)
ALTER TABLE "ServiceSite" ADD COLUMN IF NOT EXISTS "geom" geography(Point, 4326);
ALTER TABLE "ParticipantLocation" ADD COLUMN IF NOT EXISTS "geom" geography(Point, 4326);

UPDATE "ServiceSite" SET "geom" = ST_SetSRID(ST_MakePoint("lng", "lat"), 4326)::geography WHERE "geom" IS NULL;
UPDATE "ParticipantLocation" SET "geom" = ST_SetSRID(ST_MakePoint("lng", "lat"), 4326)::geography WHERE "geom" IS NULL;

CREATE INDEX IF NOT EXISTS "ServiceSite_geom_gist" ON "ServiceSite" USING GIST ("geom");
CREATE INDEX IF NOT EXISTS "ParticipantLocation_geom_gist" ON "ParticipantLocation" USING GIST ("geom");

-- Foreign keys
ALTER TABLE "ServiceSite" ADD CONSTRAINT "ServiceSite_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ParticipantLocation" ADD CONSTRAINT "ParticipantLocation_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScheduledAssignment" ADD CONSTRAINT "ScheduledAssignment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ScheduledAssignment" ADD CONSTRAINT "ScheduledAssignment_careShiftId_fkey" FOREIGN KEY ("careShiftId") REFERENCES "CareShift"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ScheduledAssignment" ADD CONSTRAINT "ScheduledAssignment_transportBookingId_fkey" FOREIGN KEY ("transportBookingId") REFERENCES "TransportBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ScheduledAssignment" ADD CONSTRAINT "ScheduledAssignment_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ServiceLog" ADD CONSTRAINT "ServiceLog_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ServiceLog" ADD CONSTRAINT "ServiceLog_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RouteStop" ADD CONSTRAINT "RouteStop_participantLocationId_fkey" FOREIGN KEY ("participantLocationId") REFERENCES "ParticipantLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RouteStop" ADD CONSTRAINT "RouteStop_serviceSiteId_fkey" FOREIGN KEY ("serviceSiteId") REFERENCES "ServiceSite"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TravelTimeEstimate" ADD CONSTRAINT "TravelTimeEstimate_routePlanId_fkey" FOREIGN KEY ("routePlanId") REFERENCES "RoutePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TravelTimeEstimate" ADD CONSTRAINT "TravelTimeEstimate_fromStopId_fkey" FOREIGN KEY ("fromStopId") REFERENCES "RouteStop"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TravelTimeEstimate" ADD CONSTRAINT "TravelTimeEstimate_toStopId_fkey" FOREIGN KEY ("toStopId") REFERENCES "RouteStop"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TransportBooking" ADD CONSTRAINT "TransportBooking_pickupParticipantLocationId_fkey" FOREIGN KEY ("pickupParticipantLocationId") REFERENCES "ParticipantLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TransportBooking" ADD CONSTRAINT "TransportBooking_dropoffParticipantLocationId_fkey" FOREIGN KEY ("dropoffParticipantLocationId") REFERENCES "ParticipantLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SchedulingRun" ADD CONSTRAINT "SchedulingRun_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "ServiceLog_careShiftId_key" ON "ServiceLog"("careShiftId");
CREATE UNIQUE INDEX IF NOT EXISTS "ServiceLog_transportBookingId_key" ON "ServiceLog"("transportBookingId");
CREATE INDEX IF NOT EXISTS "ServiceSite_organisationId_active_idx" ON "ServiceSite"("organisationId", "active");
CREATE INDEX IF NOT EXISTS "ParticipantLocation_participantId_idx" ON "ParticipantLocation"("participantId");
CREATE INDEX IF NOT EXISTS "ScheduledAssignment_resourceType_resourceId_startsAt_endsAt_idx" ON "ScheduledAssignment"("resourceType", "resourceId", "startsAt", "endsAt");
CREATE INDEX IF NOT EXISTS "ScheduledAssignment_bookingId_idx" ON "ScheduledAssignment"("bookingId");
CREATE INDEX IF NOT EXISTS "ScheduledAssignment_organisationId_idx" ON "ScheduledAssignment"("organisationId");
CREATE INDEX IF NOT EXISTS "ServiceLog_participantId_idx" ON "ServiceLog"("participantId");
CREATE INDEX IF NOT EXISTS "ServiceLog_bookingId_idx" ON "ServiceLog"("bookingId");
CREATE INDEX IF NOT EXISTS "TravelTimeMatrixCache_expiresAt_idx" ON "TravelTimeMatrixCache"("expiresAt");
CREATE INDEX IF NOT EXISTS "SchedulingRun_organisationId_createdAt_idx" ON "SchedulingRun"("organisationId", "createdAt");

ALTER TYPE "MatchFactorType" ADD VALUE IF NOT EXISTS 'travel_time';
ALTER TYPE "MatchFactorType" ADD VALUE IF NOT EXISTS 'region';
