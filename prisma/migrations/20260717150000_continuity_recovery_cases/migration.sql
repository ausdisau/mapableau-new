CREATE TYPE "ContinuityRecoveryStatus" AS ENUM ('detected', 'alternatives_prepared', 'awaiting_participant', 'participant_approved', 'confirmed', 'unresolved', 'closed');
CREATE TYPE "ContinuityRecoveryAlternativeKind" AS ENUM ('worker_candidate', 'transport_keep', 'transport_reschedule', 'transport_cancel_request', 'regional_candidate');

CREATE TABLE "continuity_recovery_cases" (
    "id" TEXT NOT NULL,
    "caseKey" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "organisationId" TEXT,
    "careShiftId" TEXT,
    "careBookingId" TEXT,
    "transportTripId" TEXT,
    "transportBookingId" TEXT,
    "missionRef" TEXT,
    "failureSignal" TEXT NOT NULL,
    "status" "ContinuityRecoveryStatus" NOT NULL DEFAULT 'detected',
    "transportPreserved" BOOLEAN NOT NULL DEFAULT true,
    "transportAutoCancelled" BOOLEAN NOT NULL DEFAULT false,
    "summary" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "continuity_recovery_cases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "continuity_recovery_alternatives" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "kind" "ContinuityRecoveryAlternativeKind" NOT NULL,
    "label" TEXT NOT NULL,
    "readinessState" TEXT NOT NULL DEFAULT 'candidate',
    "compatible" BOOLEAN NOT NULL DEFAULT false,
    "providerAccepted" BOOLEAN NOT NULL DEFAULT false,
    "participantApproved" BOOLEAN NOT NULL DEFAULT false,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "reasonsJson" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "continuity_recovery_alternatives_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "continuity_recovery_receipts" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "chosenAlternativeId" TEXT,
    "participantUserId" TEXT NOT NULL,
    "transportPreserved" BOOLEAN NOT NULL,
    "transportCancelRequested" BOOLEAN NOT NULL DEFAULT false,
    "outcome" TEXT NOT NULL,
    "plainLanguageSummary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "continuity_recovery_receipts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "continuity_recovery_cases_caseKey_key" ON "continuity_recovery_cases"("caseKey");
CREATE INDEX "continuity_recovery_cases_participantId_status_idx" ON "continuity_recovery_cases"("participantId", "status");
CREATE INDEX "continuity_recovery_cases_careShiftId_idx" ON "continuity_recovery_cases"("careShiftId");
CREATE INDEX "continuity_recovery_cases_transportTripId_idx" ON "continuity_recovery_cases"("transportTripId");
CREATE INDEX "continuity_recovery_alternatives_caseId_idx" ON "continuity_recovery_alternatives"("caseId");
CREATE UNIQUE INDEX "continuity_recovery_receipts_caseId_key" ON "continuity_recovery_receipts"("caseId");

ALTER TABLE "continuity_recovery_alternatives" ADD CONSTRAINT "continuity_recovery_alternatives_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "continuity_recovery_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "continuity_recovery_receipts" ADD CONSTRAINT "continuity_recovery_receipts_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "continuity_recovery_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
