-- Extend BookingType enum
ALTER TYPE "BookingType" ADD VALUE IF NOT EXISTS 'telehealth';
ALTER TYPE "BookingType" ADD VALUE IF NOT EXISTS 'marketplace';
ALTER TYPE "BookingType" ADD VALUE IF NOT EXISTS 'foods';
ALTER TYPE "BookingType" ADD VALUE IF NOT EXISTS 'employment';
ALTER TYPE "BookingType" ADD VALUE IF NOT EXISTS 'support_coordination';

-- Extend BookingStatus enum with unified lifecycle values
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'provider_review';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'more_information_requested';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'accepted';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'assigned';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'participant_confirmed';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'service_log_pending';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'service_log_submitted';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'participant_review';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'closed';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'declined';

-- Create new enums
CREATE TYPE "BookingAssigneeRole" AS ENUM ('worker', 'driver', 'practitioner');
CREATE TYPE "BookingServiceLogStatus" AS ENUM ('draft', 'submitted', 'approved', 'disputed');
CREATE TYPE "DataAccessReason" AS ENUM ('booking_view', 'booking_list', 'admin_review', 'plan_manager_invoice', 'support_coordination');

-- Booking extensions
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "assignedPractitionerId" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "module" "BookingType";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Booking_assignedPractitionerId_fkey'
  ) THEN
    ALTER TABLE "Booking"
      ADD CONSTRAINT "Booking_assignedPractitionerId_fkey"
      FOREIGN KEY ("assignedPractitionerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- booking_events
CREATE TABLE IF NOT EXISTS "booking_events" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "fromStatus" "BookingStatus",
  "toStatus" "BookingStatus",
  "title" TEXT NOT NULL,
  "description" TEXT,
  "actorUserId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "booking_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "booking_events_bookingId_createdAt_idx" ON "booking_events"("bookingId", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'booking_events_bookingId_fkey') THEN
    ALTER TABLE "booking_events"
      ADD CONSTRAINT "booking_events_bookingId_fkey"
      FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'booking_events_actorUserId_fkey') THEN
    ALTER TABLE "booking_events"
      ADD CONSTRAINT "booking_events_actorUserId_fkey"
      FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- booking_assignments
CREATE TABLE IF NOT EXISTS "booking_assignments" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "assigneeUserId" TEXT NOT NULL,
  "assigneeRole" "BookingAssigneeRole" NOT NULL,
  "assignedById" TEXT,
  "organisationId" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "unassignedAt" TIMESTAMP(3),
  CONSTRAINT "booking_assignments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "booking_assignments_bookingId_active_idx" ON "booking_assignments"("bookingId", "active");
CREATE INDEX IF NOT EXISTS "booking_assignments_assigneeUserId_active_idx" ON "booking_assignments"("assigneeUserId", "active");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'booking_assignments_bookingId_fkey') THEN
    ALTER TABLE "booking_assignments"
      ADD CONSTRAINT "booking_assignments_bookingId_fkey"
      FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'booking_assignments_assigneeUserId_fkey') THEN
    ALTER TABLE "booking_assignments"
      ADD CONSTRAINT "booking_assignments_assigneeUserId_fkey"
      FOREIGN KEY ("assigneeUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'booking_assignments_assignedById_fkey') THEN
    ALTER TABLE "booking_assignments"
      ADD CONSTRAINT "booking_assignments_assignedById_fkey"
      FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'booking_assignments_organisationId_fkey') THEN
    ALTER TABLE "booking_assignments"
      ADD CONSTRAINT "booking_assignments_organisationId_fkey"
      FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- booking_service_logs
CREATE TABLE IF NOT EXISTS "booking_service_logs" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "status" "BookingServiceLogStatus" NOT NULL DEFAULT 'draft',
  "summary" TEXT,
  "notes" TEXT,
  "evidenceDocumentIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "submittedAt" TIMESTAMP(3),
  "approvedAt" TIMESTAMP(3),
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "booking_service_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "booking_service_logs_bookingId_status_idx" ON "booking_service_logs"("bookingId", "status");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'booking_service_logs_bookingId_fkey') THEN
    ALTER TABLE "booking_service_logs"
      ADD CONSTRAINT "booking_service_logs_bookingId_fkey"
      FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'booking_service_logs_createdById_fkey') THEN
    ALTER TABLE "booking_service_logs"
      ADD CONSTRAINT "booking_service_logs_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- data_access_logs
CREATE TABLE IF NOT EXISTS "data_access_logs" (
  "id" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "participantId" TEXT,
  "bookingId" TEXT,
  "reason" "DataAccessReason" NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "data_access_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "data_access_logs_entityType_entityId_idx" ON "data_access_logs"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "data_access_logs_actorUserId_createdAt_idx" ON "data_access_logs"("actorUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "data_access_logs_bookingId_idx" ON "data_access_logs"("bookingId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'data_access_logs_actorUserId_fkey') THEN
    ALTER TABLE "data_access_logs"
      ADD CONSTRAINT "data_access_logs_actorUserId_fkey"
      FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'data_access_logs_bookingId_fkey') THEN
    ALTER TABLE "data_access_logs"
      ADD CONSTRAINT "data_access_logs_bookingId_fkey"
      FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
