-- AlterTable ConsentReceipt: purpose-specific consent fields
ALTER TABLE "consent_receipts" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "consent_receipts" ADD COLUMN IF NOT EXISTS "permittedFields" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "consent_receipts" ADD COLUMN IF NOT EXISTS "permittedActions" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "consent_receipts" ADD COLUMN IF NOT EXISTS "supporterInvolved" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "consent_receipts" ADD COLUMN IF NOT EXISTS "accessibleFormat" TEXT;
ALTER TABLE "consent_receipts" ADD COLUMN IF NOT EXISTS "policyVersion" TEXT;
ALTER TABLE "consent_receipts" ADD COLUMN IF NOT EXISTS "consentTextVersion" TEXT;
ALTER TABLE "consent_receipts" ADD COLUMN IF NOT EXISTS "issuedAt" TIMESTAMP(3);
ALTER TABLE "consent_receipts" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);
ALTER TABLE "consent_receipts" ADD COLUMN IF NOT EXISTS "withdrawnAt" TIMESTAMP(3);
ALTER TABLE "consent_receipts" ADD COLUMN IF NOT EXISTS "supersededById" TEXT;
ALTER TABLE "consent_receipts" ADD COLUMN IF NOT EXISTS "auditEventId" TEXT;

CREATE INDEX IF NOT EXISTS "consent_receipts_participantId_purpose_action_idx"
  ON "consent_receipts"("participantId", "purpose", "action");
CREATE INDEX IF NOT EXISTS "consent_receipts_expiresAt_idx"
  ON "consent_receipts"("expiresAt");

-- CreateTable GovernedActionEnvelope
CREATE TABLE IF NOT EXISTS "governed_action_envelopes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "participantId" TEXT NOT NULL,
    "initiatingUserId" TEXT NOT NULL,
    "capabilityKey" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "evidenceRefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "modelVersion" TEXT,
    "promptVersion" TEXT,
    "toolVersion" TEXT,
    "consentReceiptId" TEXT NOT NULL,
    "requiredApproverRole" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "nonce" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "singleUseConsumed" BOOLEAN NOT NULL DEFAULT false,
    "decisionReason" TEXT,
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),
    "executionResultJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "governed_action_envelopes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "governed_action_envelopes_participantId_status_idx"
  ON "governed_action_envelopes"("participantId", "status");
CREATE INDEX IF NOT EXISTS "governed_action_envelopes_tenantId_status_idx"
  ON "governed_action_envelopes"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "governed_action_envelopes_expiresAt_idx"
  ON "governed_action_envelopes"("expiresAt");
CREATE INDEX IF NOT EXISTS "governed_action_envelopes_nonce_idx"
  ON "governed_action_envelopes"("nonce");

-- CreateTable NavigatorGovernedMemory
CREATE TABLE IF NOT EXISTS "navigator_governed_memory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "contentJson" JSONB NOT NULL,
    "provenance" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "consentReceiptId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "navigator_governed_memory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "navigator_governed_memory_tenantId_participantId_category_idx"
  ON "navigator_governed_memory"("tenantId", "participantId", "category");
CREATE INDEX IF NOT EXISTS "navigator_governed_memory_expiresAt_idx"
  ON "navigator_governed_memory"("expiresAt");

-- CreateTable NavigatorEscalationCase
CREATE TABLE IF NOT EXISTS "navigator_escalation_cases" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "urgency" TEXT NOT NULL,
    "preferredContactMethod" TEXT NOT NULL,
    "confidentialityRestrictions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requiredReviewerRole" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "conflictCheckJson" JSONB NOT NULL DEFAULT '{}',
    "assignmentHistoryJson" JSONB NOT NULL DEFAULT '[]',
    "responseDeadlineAt" TIMESTAMP(3) NOT NULL,
    "participantVisibleStatus" TEXT NOT NULL DEFAULT 'awaiting_human_review',
    "status" TEXT NOT NULL DEFAULT 'open',
    "evidenceRefs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "passportId" TEXT,
    "envelopeId" TEXT,
    "resolutionSummary" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "navigator_escalation_cases_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "navigator_escalation_cases_tenantId_status_idx"
  ON "navigator_escalation_cases"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "navigator_escalation_cases_participantId_status_idx"
  ON "navigator_escalation_cases"("participantId", "status");
CREATE INDEX IF NOT EXISTS "navigator_escalation_cases_responseDeadlineAt_idx"
  ON "navigator_escalation_cases"("responseDeadlineAt");
