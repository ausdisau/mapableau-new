-- Wave 2: privacy-safe claim snapshots, claim-specific approvals, external submission records

CREATE TYPE "NdisClaimSourceType" AS ENUM (
  'ndis_claim_line',
  'ndis_claim_batch',
  'ndia_provider_claim',
  'billing_invoice',
  'legacy_invoice',
  'booking',
  'care_shift',
  'timesheet',
  'manual'
);

CREATE TYPE "NdisClaimApprovalDecision" AS ENUM (
  'approved',
  'rejected',
  'expired',
  'revoked'
);

CREATE TYPE "NdisExternalSubmissionStatus" AS ENUM (
  'preparing',
  'pending',
  'submitted',
  'acknowledgement_received',
  'processing',
  'accepted',
  'partially_paid',
  'paid',
  'rejected',
  'on_hold',
  'needs_information',
  'submission_unknown',
  'failed',
  'voided'
);

CREATE TABLE "NdisClaimSnapshot" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "participantId" TEXT,
  "sourceType" "NdisClaimSourceType" NOT NULL,
  "sourceId" TEXT NOT NULL,
  "sourceVersion" TEXT,
  "schemaVersion" TEXT NOT NULL,
  "maskedPayloadJson" JSONB NOT NULL,
  "encryptedPayloadCiphertext" TEXT NOT NULL,
  "payloadHash" TEXT NOT NULL,
  "encryptionKeyVersion" TEXT NOT NULL,
  "pricingReleaseId" TEXT,
  "supportItemCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "totalCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'AUD',
  "fundingRoute" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "supersededAt" TIMESTAMP(3),
  "supersededById" TEXT,
  "privacyReviewRequired" BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT "NdisClaimSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NdisClaimApproval" (
  "id" TEXT NOT NULL,
  "claimSnapshotId" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "decision" "NdisClaimApprovalDecision" NOT NULL,
  "payloadHash" TEXT NOT NULL,
  "approvedById" TEXT NOT NULL,
  "approvedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "revokedById" TEXT,
  "reason" TEXT,
  "approvalContextJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "NdisClaimApproval_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NdisExternalSubmission" (
  "id" TEXT NOT NULL,
  "claimSnapshotId" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "adapterKind" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "correlationId" TEXT NOT NULL,
  "requestHash" TEXT NOT NULL,
  "status" "NdisExternalSubmissionStatus" NOT NULL DEFAULT 'preparing',
  "externalReference" TEXT,
  "submittedById" TEXT,
  "submittedAt" TIMESTAMP(3),
  "lastCheckedAt" TIMESTAMP(3),
  "failureCode" TEXT,
  "safeFailureMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "NdisExternalSubmission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NdisExternalEvent" (
  "id" TEXT NOT NULL,
  "submissionId" TEXT NOT NULL,
  "externalEventId" TEXT,
  "externalStatus" TEXT NOT NULL,
  "mappedStatus" "NdisExternalSubmissionStatus",
  "payloadCiphertext" TEXT,
  "payloadHash" TEXT,
  "receivedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "NdisExternalEvent_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "NdiaProviderClaim" ADD COLUMN "currentSnapshotId" TEXT;
ALTER TABLE "NdiaProviderClaim" ADD COLUMN "payloadHash" TEXT;

ALTER TABLE "NdisClaimLine" ADD COLUMN "currentSnapshotId" TEXT;
ALTER TABLE "NdisClaimLine" ADD COLUMN "payloadHash" TEXT;

CREATE INDEX "NdisClaimSnapshot_organisationId_createdAt_idx" ON "NdisClaimSnapshot"("organisationId", "createdAt");
CREATE INDEX "NdisClaimSnapshot_participantId_createdAt_idx" ON "NdisClaimSnapshot"("participantId", "createdAt");
CREATE INDEX "NdisClaimSnapshot_sourceType_sourceId_idx" ON "NdisClaimSnapshot"("sourceType", "sourceId");
CREATE INDEX "NdisClaimSnapshot_payloadHash_idx" ON "NdisClaimSnapshot"("payloadHash");
CREATE INDEX "NdisClaimSnapshot_supersededAt_idx" ON "NdisClaimSnapshot"("supersededAt");

CREATE INDEX "NdisClaimApproval_claimSnapshotId_decision_idx" ON "NdisClaimApproval"("claimSnapshotId", "decision");
CREATE INDEX "NdisClaimApproval_organisationId_createdAt_idx" ON "NdisClaimApproval"("organisationId", "createdAt");
CREATE INDEX "NdisClaimApproval_expiresAt_idx" ON "NdisClaimApproval"("expiresAt");
CREATE INDEX "NdisClaimApproval_payloadHash_idx" ON "NdisClaimApproval"("payloadHash");

CREATE UNIQUE INDEX "NdisExternalSubmission_idempotencyKey_key" ON "NdisExternalSubmission"("idempotencyKey");
CREATE INDEX "NdisExternalSubmission_claimSnapshotId_status_idx" ON "NdisExternalSubmission"("claimSnapshotId", "status");
CREATE INDEX "NdisExternalSubmission_organisationId_createdAt_idx" ON "NdisExternalSubmission"("organisationId", "createdAt");
CREATE INDEX "NdisExternalSubmission_externalReference_idx" ON "NdisExternalSubmission"("externalReference");

CREATE UNIQUE INDEX "NdisExternalEvent_submissionId_externalEventId_key" ON "NdisExternalEvent"("submissionId", "externalEventId");
CREATE INDEX "NdisExternalEvent_submissionId_createdAt_idx" ON "NdisExternalEvent"("submissionId", "createdAt");

CREATE INDEX "NdiaProviderClaim_currentSnapshotId_idx" ON "NdiaProviderClaim"("currentSnapshotId");
CREATE INDEX "NdiaProviderClaim_payloadHash_idx" ON "NdiaProviderClaim"("payloadHash");
CREATE INDEX "NdisClaimLine_currentSnapshotId_idx" ON "NdisClaimLine"("currentSnapshotId");
CREATE INDEX "NdisClaimLine_payloadHash_idx" ON "NdisClaimLine"("payloadHash");

ALTER TABLE "NdisClaimSnapshot" ADD CONSTRAINT "NdisClaimSnapshot_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NdisClaimSnapshot" ADD CONSTRAINT "NdisClaimSnapshot_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NdisClaimSnapshot" ADD CONSTRAINT "NdisClaimSnapshot_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NdisClaimSnapshot" ADD CONSTRAINT "NdisClaimSnapshot_supersededById_fkey" FOREIGN KEY ("supersededById") REFERENCES "NdisClaimSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "NdisClaimApproval" ADD CONSTRAINT "NdisClaimApproval_claimSnapshotId_fkey" FOREIGN KEY ("claimSnapshotId") REFERENCES "NdisClaimSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NdisClaimApproval" ADD CONSTRAINT "NdisClaimApproval_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NdisClaimApproval" ADD CONSTRAINT "NdisClaimApproval_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NdisClaimApproval" ADD CONSTRAINT "NdisClaimApproval_revokedById_fkey" FOREIGN KEY ("revokedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "NdisExternalSubmission" ADD CONSTRAINT "NdisExternalSubmission_claimSnapshotId_fkey" FOREIGN KEY ("claimSnapshotId") REFERENCES "NdisClaimSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NdisExternalSubmission" ADD CONSTRAINT "NdisExternalSubmission_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NdisExternalSubmission" ADD CONSTRAINT "NdisExternalSubmission_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "NdisExternalEvent" ADD CONSTRAINT "NdisExternalEvent_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "NdisExternalSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "NdiaProviderClaim" ADD CONSTRAINT "NdiaProviderClaim_currentSnapshotId_fkey" FOREIGN KEY ("currentSnapshotId") REFERENCES "NdisClaimSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NdisClaimLine" ADD CONSTRAINT "NdisClaimLine_currentSnapshotId_fkey" FOREIGN KEY ("currentSnapshotId") REFERENCES "NdisClaimSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
