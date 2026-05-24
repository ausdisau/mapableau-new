-- MapAble Care, Transport, Employment module extensions
-- PostGIS optional: enable when extension is available on host

CREATE EXTENSION IF NOT EXISTS postgis;

-- Care request status history
CREATE TABLE IF NOT EXISTS "CareRequestStatusHistory" (
    "id" TEXT NOT NULL,
    "careRequestId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "actorUserId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CareRequestStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CareRequestStatusHistory_careRequestId_createdAt_idx"
    ON "CareRequestStatusHistory"("careRequestId", "createdAt");

ALTER TABLE "CareRequestStatusHistory"
    ADD CONSTRAINT "CareRequestStatusHistory_careRequestId_fkey"
    FOREIGN KEY ("careRequestId") REFERENCES "CareRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Transport booking locations (float coords; PostGIS geography optional later)
CREATE TABLE IF NOT EXISTS "TransportBookingLocation" (
    "id" TEXT NOT NULL,
    "transportBookingId" TEXT NOT NULL,
    "pickupLat" DOUBLE PRECISION,
    "pickupLng" DOUBLE PRECISION,
    "dropoffLat" DOUBLE PRECISION,
    "dropoffLng" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TransportBookingLocation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TransportBookingLocation_transportBookingId_key"
    ON "TransportBookingLocation"("transportBookingId");

ALTER TABLE "TransportBookingLocation"
    ADD CONSTRAINT "TransportBookingLocation_transportBookingId_fkey"
    FOREIGN KEY ("transportBookingId") REFERENCES "TransportBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Transport status history
CREATE TABLE IF NOT EXISTS "TransportStatusHistory" (
    "id" TEXT NOT NULL,
    "transportBookingId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "actorUserId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TransportStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TransportStatusHistory_transportBookingId_createdAt_idx"
    ON "TransportStatusHistory"("transportBookingId", "createdAt");

ALTER TABLE "TransportStatusHistory"
    ADD CONSTRAINT "TransportStatusHistory_transportBookingId_fkey"
    FOREIGN KEY ("transportBookingId") REFERENCES "TransportBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Live tracking pings (Phase 5)
CREATE TABLE IF NOT EXISTS "TransportTrackingPing" (
    "id" TEXT NOT NULL,
    "transportBookingId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "driverProfileId" TEXT,
    CONSTRAINT "TransportTrackingPing_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TransportTrackingPing_transportBookingId_recordedAt_idx"
    ON "TransportTrackingPing"("transportBookingId", "recordedAt");

ALTER TABLE "TransportTrackingPing"
    ADD CONSTRAINT "TransportTrackingPing_transportBookingId_fkey"
    FOREIGN KEY ("transportBookingId") REFERENCES "TransportBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Job bookmarks
CREATE TABLE IF NOT EXISTS "JobBookmark" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JobBookmark_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "JobBookmark_participantId_jobId_key"
    ON "JobBookmark"("participantId", "jobId");

CREATE INDEX IF NOT EXISTS "JobBookmark_participantId_idx" ON "JobBookmark"("participantId");

ALTER TABLE "JobBookmark"
    ADD CONSTRAINT "JobBookmark_participantId_fkey"
    FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "JobBookmark"
    ADD CONSTRAINT "JobBookmark_jobId_fkey"
    FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Orchestration enum value
ALTER TYPE "OrchestrationEventType" ADD VALUE IF NOT EXISTS 'invoice_from_transport_booking';
