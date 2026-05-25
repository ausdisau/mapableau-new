-- Admin panels: marketplace & provider operations extension

-- AlterTable
ALTER TABLE "Organisation" ADD COLUMN IF NOT EXISTS "bookingEligible" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "participantApprovedAt" TIMESTAMP(3);

-- CreateEnum
CREATE TYPE "JobPostStatus" AS ENUM ('draft', 'open', 'filled', 'closed', 'cancelled');
CREATE TYPE "QuoteRequestStatus" AS ENUM ('draft', 'sent', 'responded', 'accepted', 'declined', 'expired');
CREATE TYPE "QuoteResponseStatus" AS ENUM ('draft', 'submitted', 'accepted', 'declined', 'withdrawn');
CREATE TYPE "ServiceLogStatus" AS ENUM ('draft', 'in_progress', 'submitted', 'approved', 'disputed');
CREATE TYPE "ComplaintStatus" AS ENUM ('draft', 'open', 'investigating', 'resolved', 'escalated', 'closed');
CREATE TYPE "WaitlistStatus" AS ENUM ('waiting', 'offered', 'accepted', 'withdrawn', 'expired');
CREATE TYPE "QualitySignalStatus" AS ENUM ('open', 'acknowledged', 'remediated', 'closed');

-- CreateTable
CREATE TABLE "JobPost" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "supportCategory" TEXT,
    "suburb" TEXT,
    "state" TEXT,
    "status" "JobPostStatus" NOT NULL DEFAULT 'draft',
    "preferredStart" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "JobPost_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuoteRequest" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "jobPostId" TEXT,
    "organisationId" TEXT,
    "status" "QuoteRequestStatus" NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "QuoteRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuoteResponse" (
    "id" TEXT NOT NULL,
    "quoteRequestId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "status" "QuoteResponseStatus" NOT NULL DEFAULT 'draft',
    "amountCents" INTEGER,
    "summary" TEXT,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "QuoteResponse_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProviderService" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "supportCategory" TEXT NOT NULL,
    "ndisLineItemCode" TEXT,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProviderService_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProviderServiceRegion" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "regionName" TEXT NOT NULL,
    "state" TEXT,
    "postcodePrefix" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProviderServiceRegion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AccessCapability" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "capabilityKey" TEXT NOT NULL,
    "label" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AccessCapability_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServiceLog" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "workerProfileId" TEXT,
    "bookingId" TEXT,
    "careShiftId" TEXT,
    "status" "ServiceLogStatus" NOT NULL DEFAULT 'draft',
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "summary" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ServiceLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProgressNote" (
    "id" TEXT NOT NULL,
    "serviceLogId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProgressNote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "organisationId" TEXT,
    "bookingId" TEXT,
    "category" TEXT NOT NULL,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'draft',
    "description" TEXT NOT NULL,
    "escalated" BOOLEAN NOT NULL DEFAULT false,
    "safeguarding" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkerScreeningCheck" (
    "id" TEXT NOT NULL,
    "workerProfileId" TEXT NOT NULL,
    "checkType" TEXT NOT NULL,
    "status" "WorkerCredentialStatus" NOT NULL DEFAULT 'pending_review',
    "referenceNumber" TEXT,
    "expiresAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WorkerScreeningCheck_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CredentialDocument" (
    "id" TEXT NOT NULL,
    "workerProfileId" TEXT,
    "organisationId" TEXT,
    "documentId" TEXT,
    "credentialType" TEXT NOT NULL,
    "status" "WorkerCredentialStatus" NOT NULL DEFAULT 'pending_review',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CredentialDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WaitlistRequest" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "organisationId" TEXT,
    "serviceType" TEXT NOT NULL,
    "status" "WaitlistStatus" NOT NULL DEFAULT 'waiting',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WaitlistRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RosterAssignment" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "workerProfileId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "careShiftId" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RosterAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProviderQualitySignal" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "signalType" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "summary" TEXT NOT NULL,
    "status" "QualitySignalStatus" NOT NULL DEFAULT 'open',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProviderQualitySignal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DataAccessLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "actorRole" "MapAbleUserRole",
    "subjectUserId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "action" TEXT NOT NULL,
    "consentVerified" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DataAccessLog_pkey" PRIMARY KEY ("id")
);

-- Indexes & FKs
CREATE INDEX "JobPost_participantId_status_idx" ON "JobPost"("participantId", "status");
CREATE INDEX "QuoteRequest_participantId_status_idx" ON "QuoteRequest"("participantId", "status");
CREATE INDEX "QuoteRequest_organisationId_idx" ON "QuoteRequest"("organisationId");
CREATE INDEX "QuoteResponse_quoteRequestId_idx" ON "QuoteResponse"("quoteRequestId");
CREATE INDEX "QuoteResponse_organisationId_idx" ON "QuoteResponse"("organisationId");
CREATE INDEX "ProviderService_organisationId_active_idx" ON "ProviderService"("organisationId", "active");
CREATE INDEX "ProviderServiceRegion_organisationId_idx" ON "ProviderServiceRegion"("organisationId");
CREATE UNIQUE INDEX "AccessCapability_organisationId_capabilityKey_key" ON "AccessCapability"("organisationId", "capabilityKey");
CREATE INDEX "ServiceLog_organisationId_status_idx" ON "ServiceLog"("organisationId", "status");
CREATE INDEX "ServiceLog_participantId_idx" ON "ServiceLog"("participantId");
CREATE INDEX "ProgressNote_serviceLogId_idx" ON "ProgressNote"("serviceLogId");
CREATE INDEX "Complaint_participantId_status_idx" ON "Complaint"("participantId", "status");
CREATE INDEX "Complaint_organisationId_idx" ON "Complaint"("organisationId");
CREATE INDEX "WorkerScreeningCheck_workerProfileId_checkType_idx" ON "WorkerScreeningCheck"("workerProfileId", "checkType");
CREATE INDEX "CredentialDocument_workerProfileId_idx" ON "CredentialDocument"("workerProfileId");
CREATE INDEX "WaitlistRequest_participantId_status_idx" ON "WaitlistRequest"("participantId", "status");
CREATE UNIQUE INDEX "RosterAssignment_careShiftId_key" ON "RosterAssignment"("careShiftId");
CREATE INDEX "RosterAssignment_organisationId_startAt_idx" ON "RosterAssignment"("organisationId", "startAt");
CREATE INDEX "RosterAssignment_workerProfileId_idx" ON "RosterAssignment"("workerProfileId");
CREATE INDEX "ProviderQualitySignal_organisationId_status_idx" ON "ProviderQualitySignal"("organisationId", "status");
CREATE INDEX "DataAccessLog_subjectUserId_createdAt_idx" ON "DataAccessLog"("subjectUserId", "createdAt");
CREATE INDEX "DataAccessLog_actorUserId_createdAt_idx" ON "DataAccessLog"("actorUserId", "createdAt");

ALTER TABLE "JobPost" ADD CONSTRAINT "JobPost_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuoteRequest" ADD CONSTRAINT "QuoteRequest_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuoteRequest" ADD CONSTRAINT "QuoteRequest_jobPostId_fkey" FOREIGN KEY ("jobPostId") REFERENCES "JobPost"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "QuoteRequest" ADD CONSTRAINT "QuoteRequest_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "QuoteResponse" ADD CONSTRAINT "QuoteResponse_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuoteResponse" ADD CONSTRAINT "QuoteResponse_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuoteResponse" ADD CONSTRAINT "QuoteResponse_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProviderService" ADD CONSTRAINT "ProviderService_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProviderServiceRegion" ADD CONSTRAINT "ProviderServiceRegion_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccessCapability" ADD CONSTRAINT "AccessCapability_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceLog" ADD CONSTRAINT "ServiceLog_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceLog" ADD CONSTRAINT "ServiceLog_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceLog" ADD CONSTRAINT "ServiceLog_workerProfileId_fkey" FOREIGN KEY ("workerProfileId") REFERENCES "WorkerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ServiceLog" ADD CONSTRAINT "ServiceLog_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProgressNote" ADD CONSTRAINT "ProgressNote_serviceLogId_fkey" FOREIGN KEY ("serviceLogId") REFERENCES "ServiceLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgressNote" ADD CONSTRAINT "ProgressNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkerScreeningCheck" ADD CONSTRAINT "WorkerScreeningCheck_workerProfileId_fkey" FOREIGN KEY ("workerProfileId") REFERENCES "WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CredentialDocument" ADD CONSTRAINT "CredentialDocument_workerProfileId_fkey" FOREIGN KEY ("workerProfileId") REFERENCES "WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WaitlistRequest" ADD CONSTRAINT "WaitlistRequest_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WaitlistRequest" ADD CONSTRAINT "WaitlistRequest_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RosterAssignment" ADD CONSTRAINT "RosterAssignment_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RosterAssignment" ADD CONSTRAINT "RosterAssignment_workerProfileId_fkey" FOREIGN KEY ("workerProfileId") REFERENCES "WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RosterAssignment" ADD CONSTRAINT "RosterAssignment_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProviderQualitySignal" ADD CONSTRAINT "ProviderQualitySignal_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DataAccessLog" ADD CONSTRAINT "DataAccessLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DataAccessLog" ADD CONSTRAINT "DataAccessLog_subjectUserId_fkey" FOREIGN KEY ("subjectUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
