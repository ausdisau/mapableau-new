-- MapAble OSM transport dispatch (PostGIS optional; lat/lng primary)

CREATE EXTENSION IF NOT EXISTS postgis;

-- Migrate TransportBookingStatus enum
CREATE TYPE "TransportBookingStatus_new" AS ENUM (
  'draft',
  'quote_requested',
  'quoted',
  'participant_confirmed',
  'provider_accepted',
  'driver_assigned',
  'vehicle_dispatched',
  'arrived_at_pickup',
  'passenger_onboard',
  'arrived_at_destination',
  'completed',
  'invoiced',
  'paid',
  'cancelled',
  'late_risk',
  'no_show',
  'access_issue',
  'incident_reported',
  'disputed'
);

ALTER TABLE "TransportBooking" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "TransportBooking"
  ALTER COLUMN "status" TYPE TEXT USING ("status"::TEXT);

UPDATE "TransportBooking" SET "status" = CASE "status"
  WHEN 'requested' THEN 'quote_requested'
  WHEN 'awaiting_operator_response' THEN 'quote_requested'
  WHEN 'operator_accepted' THEN 'provider_accepted'
  WHEN 'vehicle_assigned' THEN 'vehicle_dispatched'
  WHEN 'confirmed' THEN 'participant_confirmed'
  WHEN 'driver_en_route' THEN 'vehicle_dispatched'
  WHEN 'arrived_for_pickup' THEN 'arrived_at_pickup'
  WHEN 'participant_on_board' THEN 'passenger_onboard'
  WHEN 'in_transit' THEN 'passenger_onboard'
  ELSE "status"
END;

ALTER TABLE "TransportBooking"
  ALTER COLUMN "status" TYPE "TransportBookingStatus_new" USING ("status"::"TransportBookingStatus_new");

DROP TYPE "TransportBookingStatus";
ALTER TYPE "TransportBookingStatus_new" RENAME TO "TransportBookingStatus";
ALTER TABLE "TransportBooking" ALTER COLUMN "status" SET DEFAULT 'draft';

-- New enums
CREATE TYPE "TransportTripQuoteStatus" AS ENUM ('draft', 'active', 'accepted', 'expired');
CREATE TYPE "RoutingProviderName" AS ENUM ('openrouteservice', 'valhalla', 'opentripplanner', 'disabled', 'placeholder');
CREATE TYPE "StoredLocationLabel" AS ENUM ('home', 'work', 'saved', 'other');
CREATE TYPE "GeocodeSource" AS ENUM ('nominatim', 'manual');

ALTER TYPE "OrchestrationEventType" ADD VALUE IF NOT EXISTS 'invoice_from_transport';

-- StoredLocation
CREATE TABLE "StoredLocation" (
  "id" TEXT NOT NULL,
  "ownerUserId" TEXT NOT NULL,
  "label" "StoredLocationLabel" NOT NULL DEFAULT 'saved',
  "addressLine" TEXT NOT NULL,
  "suburb" TEXT,
  "state" TEXT,
  "postcode" TEXT,
  "lat" DOUBLE PRECISION NOT NULL,
  "lng" DOUBLE PRECISION NOT NULL,
  "geocodedAt" TIMESTAMP(3),
  "geocodeSource" "GeocodeSource" NOT NULL DEFAULT 'nominatim',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StoredLocation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StoredLocation_ownerUserId_idx" ON "StoredLocation"("ownerUserId");
CREATE INDEX "StoredLocation_lat_lng_idx" ON "StoredLocation"("lat", "lng");

ALTER TABLE "StoredLocation" ADD CONSTRAINT "StoredLocation_ownerUserId_fkey"
  FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- TransportBooking extensions
ALTER TABLE "TransportBooking" ADD COLUMN IF NOT EXISTS "pickupLocationId" TEXT;
ALTER TABLE "TransportBooking" ADD COLUMN IF NOT EXISTS "dropoffLocationId" TEXT;
ALTER TABLE "TransportBooking" ADD COLUMN IF NOT EXISTS "companionCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "TransportBooking" ADD COLUMN IF NOT EXISTS "accessNeeds" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "TransportBooking" ADD COLUMN IF NOT EXISTS "communicationPreferences" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "TransportBooking" ADD COLUMN IF NOT EXISTS "quotedFareCents" INTEGER;
ALTER TABLE "TransportBooking" ADD COLUMN IF NOT EXISTS "quoteExpiresAt" TIMESTAMP(3);
ALTER TABLE "TransportBooking" ADD COLUMN IF NOT EXISTS "selectedRoutePlanId" TEXT;

ALTER TABLE "TransportBooking" ADD CONSTRAINT "TransportBooking_pickupLocationId_fkey"
  FOREIGN KEY ("pickupLocationId") REFERENCES "StoredLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TransportBooking" ADD CONSTRAINT "TransportBooking_dropoffLocationId_fkey"
  FOREIGN KEY ("dropoffLocationId") REFERENCES "StoredLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- TransportTripQuote
CREATE TABLE "TransportTripQuote" (
  "id" TEXT NOT NULL,
  "transportBookingId" TEXT NOT NULL,
  "status" "TransportTripQuoteStatus" NOT NULL DEFAULT 'draft',
  "distanceMeters" INTEGER,
  "durationSeconds" INTEGER,
  "fareBreakdown" JSONB NOT NULL DEFAULT '{}',
  "routeSummary" JSONB NOT NULL DEFAULT '{}',
  "routingProvider" "RoutingProviderName" NOT NULL DEFAULT 'openrouteservice',
  "providerRequestId" TEXT,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TransportTripQuote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TransportTripQuote_transportBookingId_status_idx" ON "TransportTripQuote"("transportBookingId", "status");

ALTER TABLE "TransportTripQuote" ADD CONSTRAINT "TransportTripQuote_transportBookingId_fkey"
  FOREIGN KEY ("transportBookingId") REFERENCES "TransportBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DispatchEvent
CREATE TABLE "DispatchEvent" (
  "id" TEXT NOT NULL,
  "transportBookingId" TEXT NOT NULL,
  "fromStatus" "TransportBookingStatus",
  "toStatus" "TransportBookingStatus" NOT NULL,
  "actorUserId" TEXT,
  "reason" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DispatchEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DispatchEvent_transportBookingId_createdAt_idx" ON "DispatchEvent"("transportBookingId", "createdAt");

ALTER TABLE "DispatchEvent" ADD CONSTRAINT "DispatchEvent_transportBookingId_fkey"
  FOREIGN KEY ("transportBookingId") REFERENCES "TransportBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DispatchEvent" ADD CONSTRAINT "DispatchEvent_actorUserId_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Driver capabilities
ALTER TABLE "DriverProfile" ADD COLUMN IF NOT EXISTS "driverCapabilities" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- RoutePlan extensions
ALTER TABLE "RoutePlan" ADD COLUMN IF NOT EXISTS "routingProvider" "RoutingProviderName" NOT NULL DEFAULT 'disabled';
ALTER TABLE "RoutePlan" ADD COLUMN IF NOT EXISTS "encodedPolyline" TEXT;
ALTER TABLE "RoutePlan" ADD COLUMN IF NOT EXISTS "distanceMeters" INTEGER;
ALTER TABLE "RoutePlan" ADD COLUMN IF NOT EXISTS "durationSeconds" INTEGER;

ALTER TABLE "RoutePlan" ADD CONSTRAINT "RoutePlan_transportBookingId_fkey"
  FOREIGN KEY ("transportBookingId") REFERENCES "TransportBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "RoutePlan_transportBookingId_idx" ON "RoutePlan"("transportBookingId");

-- RouteLeg
CREATE TABLE "RouteLeg" (
  "id" TEXT NOT NULL,
  "routePlanId" TEXT NOT NULL,
  "sequence" INTEGER NOT NULL,
  "fromLat" DOUBLE PRECISION NOT NULL,
  "fromLng" DOUBLE PRECISION NOT NULL,
  "toLat" DOUBLE PRECISION NOT NULL,
  "toLng" DOUBLE PRECISION NOT NULL,
  "distanceMeters" INTEGER,
  "durationSeconds" INTEGER,
  "encodedPolyline" TEXT,
  CONSTRAINT "RouteLeg_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RouteLeg_routePlanId_sequence_idx" ON "RouteLeg"("routePlanId", "sequence");

ALTER TABLE "RouteLeg" ADD CONSTRAINT "RouteLeg_routePlanId_fkey"
  FOREIGN KEY ("routePlanId") REFERENCES "RoutePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- TravelTimeMatrixCell
CREATE TABLE "TravelTimeMatrixCell" (
  "id" TEXT NOT NULL,
  "originHash" TEXT NOT NULL,
  "destHash" TEXT NOT NULL,
  "durationSeconds" INTEGER NOT NULL,
  "distanceMeters" INTEGER,
  "routingProvider" "RoutingProviderName" NOT NULL DEFAULT 'openrouteservice',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TravelTimeMatrixCell_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TravelTimeMatrixCell_originHash_destHash_routingProvider_key"
  ON "TravelTimeMatrixCell"("originHash", "destHash", "routingProvider");
CREATE INDEX "TravelTimeMatrixCell_expiresAt_idx" ON "TravelTimeMatrixCell"("expiresAt");

-- Conversation.transportBookingId
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "transportBookingId" TEXT;
CREATE INDEX IF NOT EXISTS "Conversation_transportBookingId_idx" ON "Conversation"("transportBookingId");
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_transportBookingId_fkey"
  FOREIGN KEY ("transportBookingId") REFERENCES "TransportBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Invoice.transportBookingId
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "transportBookingId" TEXT;
CREATE INDEX IF NOT EXISTS "Invoice_transportBookingId_idx" ON "Invoice"("transportBookingId");
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_transportBookingId_fkey"
  FOREIGN KEY ("transportBookingId") REFERENCES "TransportBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- TripTrackingSession FK to TransportBooking
ALTER TABLE "TripTrackingSession" DROP CONSTRAINT IF EXISTS "TripTrackingSession_transportBookingId_fkey";
ALTER TABLE "TripTrackingSession" ADD CONSTRAINT "TripTrackingSession_transportBookingId_fkey"
  FOREIGN KEY ("transportBookingId") REFERENCES "TransportBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Optional PostGIS geography column (lat/lng remain source of truth for Prisma)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
    ALTER TABLE "StoredLocation" ADD COLUMN IF NOT EXISTS "geom" geography(Point, 4326);
    UPDATE "StoredLocation" SET "geom" = ST_SetSRID(ST_MakePoint("lng", "lat"), 4326)::geography WHERE "geom" IS NULL;
    CREATE INDEX IF NOT EXISTS "StoredLocation_geom_idx" ON "StoredLocation" USING GIST ("geom");
  END IF;
EXCEPTION
  WHEN others THEN NULL;
END $$;
