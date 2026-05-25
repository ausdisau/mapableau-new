DO $$ BEGIN
  CREATE TYPE "CareBookingStatus" AS ENUM ('draft','provider_accepted','worker_assigned','confirmed','in_progress','awaiting_service_log','awaiting_participant_confirmation','completed','cancelled','declined');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CareServiceLogStatus" AS ENUM ('draft','submitted','confirmed','disputed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CareInvoiceLinkStatus" AS ENUM ('placeholder','ready_for_invoice','invoiced','disputed','void');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "WorkerProfile"
  ADD COLUMN IF NOT EXISTS "highIntensityCompetencyVerified" BOOLEAN NOT NULL DEFAULT false;

DO $$ BEGIN
  ALTER TABLE "CareRequest" RENAME TO "care_requests";
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "care_bookings" (
  "id" TEXT PRIMARY KEY,
  "careRequestId" TEXT NOT NULL UNIQUE,
  "bookingId" TEXT UNIQUE,
  "participantId" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "status" "CareBookingStatus" NOT NULL DEFAULT 'provider_accepted',
  "scheduledStart" TIMESTAMP(3),
  "scheduledEnd" TIMESTAMP(3),
  "location" TEXT,
  "tasks" JSONB NOT NULL DEFAULT '[]',
  "accessRequirementsSnapshot" JSONB,
  "fundingSourceSnapshot" JSONB,
  "providerNotes" TEXT,
  "participantNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "care_bookings_careRequestId_fkey" FOREIGN KEY ("careRequestId") REFERENCES "care_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "care_bookings_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "care_bookings_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "care_bookings_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "care_booking_events" (
  "id" TEXT PRIMARY KEY,
  "bookingId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "actorUserId" TEXT,
  "notes" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "care_booking_events_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "care_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "care_booking_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "care_booking_workers" (
  "id" TEXT PRIMARY KEY,
  "bookingId" TEXT NOT NULL,
  "workerProfileId" TEXT NOT NULL,
  "assignedById" TEXT,
  "notes" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "care_booking_workers_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "care_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "care_booking_workers_workerProfileId_fkey" FOREIGN KEY ("workerProfileId") REFERENCES "WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "care_roster_assignments" (
  "id" TEXT PRIMARY KEY,
  "bookingId" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "workerProfileId" TEXT,
  "startAt" TIMESTAMP(3) NOT NULL,
  "endAt" TIMESTAMP(3) NOT NULL,
  "notes" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "care_roster_assignments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "care_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "care_roster_assignments_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "care_roster_assignments_workerProfileId_fkey" FOREIGN KEY ("workerProfileId") REFERENCES "WorkerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "care_roster_assignments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "care_service_agreements" (
  "id" TEXT PRIMARY KEY,
  "bookingId" TEXT NOT NULL,
  "careRequestId" TEXT,
  "serviceAgreementId" TEXT,
  "organisationId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'placeholder',
  "plainLanguageSummary" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "care_service_agreements_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "care_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "care_service_agreements_careRequestId_fkey" FOREIGN KEY ("careRequestId") REFERENCES "care_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "care_service_agreements_serviceAgreementId_fkey" FOREIGN KEY ("serviceAgreementId") REFERENCES "ServiceAgreement"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "care_service_agreements_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "care_service_logs" (
  "id" TEXT PRIMARY KEY,
  "bookingId" TEXT NOT NULL,
  "shiftId" TEXT UNIQUE,
  "participantId" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "workerProfileId" TEXT,
  "status" "CareServiceLogStatus" NOT NULL DEFAULT 'draft',
  "startedAt" TIMESTAMP(3),
  "endedAt" TIMESTAMP(3),
  "supportItems" JSONB NOT NULL DEFAULT '[]',
  "tasksCompleted" JSONB NOT NULL DEFAULT '[]',
  "workerNotes" TEXT,
  "participantNotes" TEXT,
  "submittedAt" TIMESTAMP(3),
  "confirmedById" TEXT,
  "confirmedAt" TIMESTAMP(3),
  "disputedAt" TIMESTAMP(3),
  "disputeReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "care_service_logs_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "care_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "care_service_logs_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "CareShift"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "care_service_logs_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "care_service_logs_workerProfileId_fkey" FOREIGN KEY ("workerProfileId") REFERENCES "WorkerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "care_service_logs_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "care_progress_notes" (
  "id" TEXT PRIMARY KEY,
  "bookingId" TEXT NOT NULL,
  "careRequestId" TEXT,
  "shiftId" TEXT,
  "serviceLogId" TEXT,
  "organisationId" TEXT NOT NULL,
  "authorId" TEXT,
  "body" TEXT NOT NULL,
  "visibleToParticipant" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "care_participant_preferences" (
  "id" TEXT PRIMARY KEY,
  "participantId" TEXT NOT NULL,
  "bookingId" TEXT,
  "careRequestId" TEXT,
  "preferenceType" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "care_worker_preferences" (
  "id" TEXT PRIMARY KEY,
  "workerProfileId" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "preferenceType" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "care_access_needs" (
  "id" TEXT PRIMARY KEY,
  "participantId" TEXT NOT NULL,
  "bookingId" TEXT,
  "careRequestId" TEXT,
  "category" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "intensity" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "care_risk_flags" (
  "id" TEXT PRIMARY KEY,
  "bookingId" TEXT,
  "careRequestId" TEXT,
  "incidentId" TEXT,
  "organisationId" TEXT,
  "flagType" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "notes" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "care_living_alone_safeguards" (
  "id" TEXT PRIMARY KEY,
  "participantId" TEXT NOT NULL,
  "bookingId" TEXT,
  "checkInRequired" BOOLEAN NOT NULL DEFAULT false,
  "escalationContact" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "care_shift_cancellations" (
  "id" TEXT PRIMARY KEY,
  "bookingId" TEXT NOT NULL,
  "shiftId" TEXT,
  "organisationId" TEXT NOT NULL,
  "workerProfileId" TEXT,
  "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "care_service_recovery_links" (
  "id" TEXT PRIMARY KEY,
  "bookingId" TEXT NOT NULL,
  "shiftId" TEXT,
  "replacementBookingId" TEXT,
  "organisationId" TEXT NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "care_invoice_links" (
  "id" TEXT PRIMARY KEY,
  "bookingId" TEXT NOT NULL,
  "serviceLogId" TEXT NOT NULL UNIQUE,
  "invoiceId" TEXT,
  "organisationId" TEXT NOT NULL,
  "status" "CareInvoiceLinkStatus" NOT NULL DEFAULT 'placeholder',
  "pricingPlaceholder" TEXT,
  "ndisLineItemCodePlaceholder" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "care_invoice_links_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "care_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "care_invoice_links_serviceLogId_fkey" FOREIGN KEY ("serviceLogId") REFERENCES "care_service_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "care_invoice_links_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "care_invoice_links_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "care_invoice_links_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

ALTER TABLE "CareShift" ADD COLUMN IF NOT EXISTS "careBookingId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "care_booking_workers_bookingId_workerProfileId_key" ON "care_booking_workers"("bookingId", "workerProfileId");
CREATE INDEX IF NOT EXISTS "care_bookings_participantId_status_idx" ON "care_bookings"("participantId", "status");
CREATE INDEX IF NOT EXISTS "care_bookings_organisationId_status_idx" ON "care_bookings"("organisationId", "status");
CREATE INDEX IF NOT EXISTS "care_service_logs_participantId_status_idx" ON "care_service_logs"("participantId", "status");
CREATE INDEX IF NOT EXISTS "care_service_logs_organisationId_status_idx" ON "care_service_logs"("organisationId", "status");
