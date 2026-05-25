-- MapAble Priority 2 service recovery and verification hub.

CREATE TYPE "ServiceRecoveryTrigger" AS ENUM ('provider_declined', 'provider_no_response', 'worker_cancelled', 'driver_late', 'worker_no_show', 'participant_reported_issue', 'service_gap_detected');
CREATE TYPE "ServiceRecoveryStatus" AS ENUM ('open', 'backup_options_found', 'awaiting_participant_choice', 'awaiting_provider_confirmation', 'resolved', 'unresolved', 'escalated');
CREATE TYPE "VerificationRecordType" AS ENUM ('abn_or_nzbn', 'ndis_registration_claim', 'insurance', 'worker_screening', 'wwcc_blue_card', 'police_check', 'driver_licence', 'vehicle_registration', 'vehicle_insurance', 'ahpra_registration', 'professional_body_membership', 'training_certificate');
CREATE TYPE "VerificationRecordStatus" AS ENUM ('not_started', 'pending_review', 'verified', 'rejected', 'expired');
CREATE TYPE "VerificationEligibilityGate" AS ENUM ('provider_booking_eligibility', 'worker_matching_eligibility', 'driver_dispatch_eligibility', 'practitioner_booking_eligibility');

CREATE TABLE "service_recovery_cases" (
  "id" TEXT NOT NULL,
  "trigger" "ServiceRecoveryTrigger" NOT NULL,
  "status" "ServiceRecoveryStatus" NOT NULL DEFAULT 'open',
  "bookingId" TEXT,
  "participantId" TEXT,
  "organisationId" TEXT,
  "summary" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "service_recovery_cases_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "service_recovery_cases_participantId_status_idx" ON "service_recovery_cases"("participantId", "status");
CREATE INDEX "service_recovery_cases_organisationId_status_idx" ON "service_recovery_cases"("organisationId", "status");
CREATE INDEX "service_recovery_cases_bookingId_idx" ON "service_recovery_cases"("bookingId");

CREATE TABLE "service_recovery_events" (
  "id" TEXT NOT NULL,
  "recoveryCaseId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "actorUserId" TEXT,
  "note" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "service_recovery_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "service_recovery_events_recoveryCaseId_createdAt_idx" ON "service_recovery_events"("recoveryCaseId", "createdAt");
ALTER TABLE "service_recovery_events" ADD CONSTRAINT "service_recovery_events_recoveryCaseId_fkey" FOREIGN KEY ("recoveryCaseId") REFERENCES "service_recovery_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "service_recovery_backup_options" (
  "id" TEXT NOT NULL,
  "recoveryCaseId" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "providerName" TEXT NOT NULL,
  "reason" TEXT,
  "safeToOffer" BOOLEAN NOT NULL DEFAULT false,
  "selectedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "service_recovery_backup_options_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "service_recovery_backup_options_recoveryCaseId_idx" ON "service_recovery_backup_options"("recoveryCaseId");
CREATE INDEX "service_recovery_backup_options_organisationId_idx" ON "service_recovery_backup_options"("organisationId");
ALTER TABLE "service_recovery_backup_options" ADD CONSTRAINT "service_recovery_backup_options_recoveryCaseId_fkey" FOREIGN KEY ("recoveryCaseId") REFERENCES "service_recovery_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "service_recovery_actions" (
  "id" TEXT NOT NULL,
  "recoveryCaseId" TEXT NOT NULL,
  "actionType" TEXT NOT NULL,
  "actorUserId" TEXT,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "service_recovery_actions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "service_recovery_actions_recoveryCaseId_createdAt_idx" ON "service_recovery_actions"("recoveryCaseId", "createdAt");
ALTER TABLE "service_recovery_actions" ADD CONSTRAINT "service_recovery_actions_recoveryCaseId_fkey" FOREIGN KEY ("recoveryCaseId") REFERENCES "service_recovery_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "recovery_escalations" (
  "id" TEXT NOT NULL,
  "recoveryCaseId" TEXT NOT NULL,
  "supportTicketId" TEXT,
  "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "recovery_escalations_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "recovery_escalations_recoveryCaseId_idx" ON "recovery_escalations"("recoveryCaseId");
ALTER TABLE "recovery_escalations" ADD CONSTRAINT "recovery_escalations_recoveryCaseId_fkey" FOREIGN KEY ("recoveryCaseId") REFERENCES "service_recovery_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "verification_records" (
  "id" TEXT NOT NULL,
  "subjectType" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "organisationId" TEXT,
  "profileId" TEXT,
  "recordType" "VerificationRecordType" NOT NULL,
  "status" "VerificationRecordStatus" NOT NULL DEFAULT 'not_started',
  "eligibilityGate" "VerificationEligibilityGate",
  "expiryDate" TIMESTAMP(3),
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "verification_records_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "verification_records_subjectType_subjectId_idx" ON "verification_records"("subjectType", "subjectId");
CREATE INDEX "verification_records_organisationId_status_idx" ON "verification_records"("organisationId", "status");
CREATE INDEX "verification_records_profileId_status_idx" ON "verification_records"("profileId", "status");
CREATE INDEX "verification_records_expiryDate_idx" ON "verification_records"("expiryDate");

CREATE TABLE "verification_documents" (
  "id" TEXT NOT NULL,
  "verificationRecordId" TEXT NOT NULL,
  "documentId" TEXT,
  "label" TEXT NOT NULL,
  "privateByDefault" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "verification_documents_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "verification_documents_verificationRecordId_idx" ON "verification_documents"("verificationRecordId");
ALTER TABLE "verification_documents" ADD CONSTRAINT "verification_documents_verificationRecordId_fkey" FOREIGN KEY ("verificationRecordId") REFERENCES "verification_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "verification_events" (
  "id" TEXT NOT NULL,
  "verificationRecordId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "actorUserId" TEXT,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "verification_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "verification_events_verificationRecordId_createdAt_idx" ON "verification_events"("verificationRecordId", "createdAt");
ALTER TABLE "verification_events" ADD CONSTRAINT "verification_events_verificationRecordId_fkey" FOREIGN KEY ("verificationRecordId") REFERENCES "verification_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
