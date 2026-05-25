-- MapAble Priority 1 minimum living service loop

CREATE TYPE "BookingEligibilityStatus" AS ENUM ('not_eligible', 'profile_incomplete', 'submitted', 'eligible');
CREATE TYPE "ServiceLogStatus" AS ENUM ('draft', 'submitted', 'participant_review', 'approved', 'disputed', 'locked');
CREATE TYPE "InvoiceParticipantStatus" AS ENUM ('draft', 'awaiting_participant_approval', 'approved', 'issued', 'disputed', 'void');

ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'provider_review';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'more_information_requested';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'accepted';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'declined';

CREATE TABLE "participant_access_needs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "plainLanguageNeed" TEXT NOT NULL,
    "importance" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "participant_access_needs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "participant_access_needs_userId_idx" ON "participant_access_needs"("userId");
ALTER TABLE "participant_access_needs" ADD CONSTRAINT "participant_access_needs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "participant_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "participantType" TEXT,
    "fundingType" TEXT,
    "primaryServiceRegion" TEXT,
    "mainSupportGoals" TEXT,
    "accessNeedsSummary" TEXT,
    "communicationPreferencesJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "participant_preferences_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "participant_preferences_userId_key" ON "participant_preferences"("userId");
ALTER TABLE "participant_preferences" ADD CONSTRAINT "participant_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "provider_organisation_profiles" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "organisationLegalName" TEXT,
    "tradingName" TEXT,
    "abnOrNzbn" TEXT,
    "primaryContactName" TEXT,
    "primaryContactRole" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "businessAddress" TEXT,
    "publicServiceRegions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "providerTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ndisRegistrationClaimStatus" TEXT,
    "bookingEligibilityStatus" "BookingEligibilityStatus" NOT NULL DEFAULT 'not_eligible',
    "listingStatus" TEXT NOT NULL DEFAULT 'profile_incomplete',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "provider_organisation_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "provider_organisation_profiles_organisationId_key" ON "provider_organisation_profiles"("organisationId");
ALTER TABLE "provider_organisation_profiles" ADD CONSTRAINT "provider_organisation_profiles_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "provider_organisation_services" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "serviceType" TEXT,
    "telehealthAvailable" BOOLEAN NOT NULL DEFAULT false,
    "acceptingNewParticipants" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "provider_organisation_services_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "provider_organisation_services_organisationId_idx" ON "provider_organisation_services"("organisationId");
ALTER TABLE "provider_organisation_services" ADD CONSTRAINT "provider_organisation_services_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "provider_service_regions" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "suburb" TEXT,
    "postcode" TEXT,
    "state" TEXT,
    "radiusKm" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "provider_service_regions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "provider_service_regions_organisationId_postcode_idx" ON "provider_service_regions"("organisationId", "postcode");
ALTER TABLE "provider_service_regions" ADD CONSTRAINT "provider_service_regions_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "provider_access_capabilities" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "capability" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "provider_access_capabilities_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "provider_access_capabilities_organisationId_idx" ON "provider_access_capabilities"("organisationId");
ALTER TABLE "provider_access_capabilities" ADD CONSTRAINT "provider_access_capabilities_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "booking_events" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "actorUserId" TEXT,
    "note" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "booking_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "booking_events_bookingId_createdAt_idx" ON "booking_events"("bookingId", "createdAt");
ALTER TABLE "booking_events" ADD CONSTRAINT "booking_events_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "service_logs" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "serviceDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "durationMinutes" INTEGER,
    "serviceSummary" TEXT NOT NULL,
    "supportItemCode" TEXT,
    "travelMinutes" INTEGER,
    "travelKm" DECIMAL(65,30),
    "status" "ServiceLogStatus" NOT NULL DEFAULT 'draft',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "service_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "service_logs_bookingId_idx" ON "service_logs"("bookingId");
CREATE INDEX "service_logs_participantId_status_idx" ON "service_logs"("participantId", "status");
ALTER TABLE "service_logs" ADD CONSTRAINT "service_logs_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "service_logs" ADD CONSTRAINT "service_logs_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "service_logs" ADD CONSTRAINT "service_logs_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "service_logs" ADD CONSTRAINT "service_logs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "service_log_events" (
    "id" TEXT NOT NULL,
    "serviceLogId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "actorUserId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "service_log_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "service_log_events_serviceLogId_createdAt_idx" ON "service_log_events"("serviceLogId", "createdAt");
ALTER TABLE "service_log_events" ADD CONSTRAINT "service_log_events_serviceLogId_fkey" FOREIGN KEY ("serviceLogId") REFERENCES "service_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "service_log_approvals" (
    "id" TEXT NOT NULL,
    "serviceLogId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "disputedAt" TIMESTAMP(3),
    "disputeReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "service_log_approvals_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "service_log_approvals_serviceLogId_key" ON "service_log_approvals"("serviceLogId");
ALTER TABLE "service_log_approvals" ADD CONSTRAINT "service_log_approvals_serviceLogId_fkey" FOREIGN KEY ("serviceLogId") REFERENCES "service_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Invoice" ADD COLUMN "serviceLogId" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "participantApprovalStatus" "InvoiceParticipantStatus" NOT NULL DEFAULT 'draft';
CREATE INDEX "Invoice_serviceLogId_idx" ON "Invoice"("serviceLogId");
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_serviceLogId_fkey" FOREIGN KEY ("serviceLogId") REFERENCES "service_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "invoice_approvals" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "disputedAt" TIMESTAMP(3),
    "disputeReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invoice_approvals_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "invoice_approvals_invoiceId_key" ON "invoice_approvals"("invoiceId");
ALTER TABLE "invoice_approvals" ADD CONSTRAINT "invoice_approvals_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "invoice_disputes" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invoice_disputes_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "invoice_disputes_invoiceId_idx" ON "invoice_disputes"("invoiceId");
ALTER TABLE "invoice_disputes" ADD CONSTRAINT "invoice_disputes_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "billing_events" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT,
    "serviceLogId" TEXT,
    "participantId" TEXT,
    "organisationId" TEXT,
    "eventType" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "billing_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "billing_events_invoiceId_createdAt_idx" ON "billing_events"("invoiceId", "createdAt");
ALTER TABLE "billing_events" ADD CONSTRAINT "billing_events_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
