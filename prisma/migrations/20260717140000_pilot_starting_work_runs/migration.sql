CREATE TABLE "pilot_starting_work_runs" (
    "id" TEXT NOT NULL,
    "journeyKey" TEXT NOT NULL,
    "participantSyntheticId" TEXT NOT NULL DEFAULT 'taylor-synthetic',
    "venueLabel" TEXT NOT NULL DEFAULT 'Harbour Civic Centre',
    "status" TEXT NOT NULL,
    "stepsCompleted" JSONB NOT NULL DEFAULT '[]',
    "notices" JSONB NOT NULL DEFAULT '[]',
    "failureMode" TEXT,
    "blockReason" TEXT,
    "readinessJson" JSONB,
    "careBookingId" TEXT,
    "careAgreementVersion" INTEGER,
    "transportQuoteId" TEXT,
    "transportTripId" TEXT,
    "billingServiceRecordId" TEXT,
    "invoiceId" TEXT,
    "outcomeReceiptId" TEXT,
    "accesscastJourneyRef" TEXT,
    "visitPackRef" TEXT,
    "workerReadinessReady" BOOLEAN NOT NULL DEFAULT false,
    "returnTransportStatus" TEXT,
    "continuityCaseRef" TEXT,
    "integrationLinks" JSONB NOT NULL DEFAULT '{}',
    "synthetic" BOOLEAN NOT NULL DEFAULT true,
    "actorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pilot_starting_work_runs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "pilot_starting_work_runs_journeyKey_key" ON "pilot_starting_work_runs"("journeyKey");
CREATE INDEX "pilot_starting_work_runs_status_createdAt_idx" ON "pilot_starting_work_runs"("status", "createdAt");
CREATE INDEX "pilot_starting_work_runs_participantSyntheticId_idx" ON "pilot_starting_work_runs"("participantSyntheticId");
