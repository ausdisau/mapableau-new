-- MapAble AURA Wave 3: extend proposals + shadow evaluation tables (additive).
-- Runtime remains in-memory unless MAPABLE_AURA_USE_PRISMA=true.
-- Does not enable write execution.

ALTER TABLE "aura_action_proposals" ADD COLUMN IF NOT EXISTS "planArtifactId" TEXT;
ALTER TABLE "aura_action_proposals" ADD COLUMN IF NOT EXISTS "planVersion" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "aura_action_proposals" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "aura_action_proposals" ADD COLUMN IF NOT EXISTS "previousVersionId" TEXT;
ALTER TABLE "aura_action_proposals" ADD COLUMN IF NOT EXISTS "supersededById" TEXT;
ALTER TABLE "aura_action_proposals" ADD COLUMN IF NOT EXISTS "risk" TEXT NOT NULL DEFAULT 'communication';
ALTER TABLE "aura_action_proposals" ADD COLUMN IF NOT EXISTS "recipientType" TEXT;
ALTER TABLE "aura_action_proposals" ADD COLUMN IF NOT EXISTS "recipientId" TEXT;
ALTER TABLE "aura_action_proposals" ADD COLUMN IF NOT EXISTS "recipientLabel" TEXT;
ALTER TABLE "aura_action_proposals" ADD COLUMN IF NOT EXISTS "purposeCode" TEXT;
ALTER TABLE "aura_action_proposals" ADD COLUMN IF NOT EXISTS "purposeText" TEXT;
ALTER TABLE "aura_action_proposals" ADD COLUMN IF NOT EXISTS "payloadJson" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "aura_action_proposals" ADD COLUMN IF NOT EXISTS "disclosureJson" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "aura_action_proposals" ADD COLUMN IF NOT EXISTS "evidenceReferencesJson" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "aura_action_proposals" ADD COLUMN IF NOT EXISTS "preconditionsJson" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "aura_action_proposals" ADD COLUMN IF NOT EXISTS "expectedResult" TEXT;
ALTER TABLE "aura_action_proposals" ADD COLUMN IF NOT EXISTS "possibleFailures" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "aura_action_proposals" ADD COLUMN IF NOT EXISTS "fallbackPlanJson" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "aura_action_proposals" ADD COLUMN IF NOT EXISTS "requiredAuthority" TEXT NOT NULL DEFAULT 'L3_PROPOSE';
ALTER TABLE "aura_action_proposals" ADD COLUMN IF NOT EXISTS "participantShadowReviewRequired" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "aura_action_proposals" ADD COLUMN IF NOT EXISTS "futureParticipantApprovalRequired" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "aura_action_proposals" ADD COLUMN IF NOT EXISTS "futureVenueApprovalRequired" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "aura_action_proposals" ADD COLUMN IF NOT EXISTS "humanReviewRequired" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "aura_action_proposals" ADD COLUMN IF NOT EXISTS "createdByActorType" TEXT NOT NULL DEFAULT 'aura';
ALTER TABLE "aura_action_proposals" ADD COLUMN IF NOT EXISTS "createdByActorId" TEXT;
ALTER TABLE "aura_action_proposals" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "aura_action_proposals_expiresAt_idx" ON "aura_action_proposals"("expiresAt");
CREATE INDEX IF NOT EXISTS "aura_action_proposals_previousVersionId_idx" ON "aura_action_proposals"("previousVersionId");

CREATE TABLE IF NOT EXISTS "aura_proposal_verifications_wave3" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "proposalVersion" INTEGER NOT NULL,
    "verifierVersion" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "checksJson" JSONB NOT NULL DEFAULT '[]',
    "futureExecutionEligible" BOOLEAN NOT NULL DEFAULT false,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "aura_proposal_verifications_wave3_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "aura_proposal_reviews" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "proposalVersion" INTEGER NOT NULL,
    "participantId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "comment" TEXT,
    "proposalHash" TEXT NOT NULL,
    "futureExecutionApproval" BOOLEAN NOT NULL DEFAULT false,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "aura_proposal_reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "aura_shadow_evaluations" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "proposalVersion" INTEGER NOT NULL,
    "missionId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "stagesJson" JSONB NOT NULL DEFAULT '[]',
    "requiredApprovalsJson" JSONB NOT NULL DEFAULT '{}',
    "requiredConsentScopes" JSONB NOT NULL DEFAULT '[]',
    "serviceAssessmentJson" JSONB NOT NULL DEFAULT '{}',
    "predictedEffectsJson" JSONB NOT NULL DEFAULT '{}',
    "failureCodes" JSONB NOT NULL DEFAULT '[]',
    "fallbackPlanJson" JSONB NOT NULL DEFAULT '[]',
    "executionAttempted" BOOLEAN NOT NULL DEFAULT false,
    "externalSideEffects" INTEGER NOT NULL DEFAULT 0,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "aura_shadow_evaluations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "aura_shadow_receipts" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "proposalVersion" INTEGER NOT NULL,
    "proposalHash" TEXT NOT NULL,
    "participantReviewId" TEXT NOT NULL,
    "shadowEvaluationId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "executionAttempted" BOOLEAN NOT NULL DEFAULT false,
    "externalSideEffects" INTEGER NOT NULL DEFAULT 0,
    "auditCorrelationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "aura_shadow_receipts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "aura_proposal_verifications_wave3_proposalId_checkedAt_idx" ON "aura_proposal_verifications_wave3"("proposalId", "checkedAt");
CREATE INDEX IF NOT EXISTS "aura_proposal_reviews_proposalId_decidedAt_idx" ON "aura_proposal_reviews"("proposalId", "decidedAt");
CREATE INDEX IF NOT EXISTS "aura_proposal_reviews_participantId_decidedAt_idx" ON "aura_proposal_reviews"("participantId", "decidedAt");
CREATE INDEX IF NOT EXISTS "aura_shadow_evaluations_proposalId_evaluatedAt_idx" ON "aura_shadow_evaluations"("proposalId", "evaluatedAt");
CREATE INDEX IF NOT EXISTS "aura_shadow_evaluations_missionId_status_idx" ON "aura_shadow_evaluations"("missionId", "status");
CREATE INDEX IF NOT EXISTS "aura_shadow_receipts_proposalId_createdAt_idx" ON "aura_shadow_receipts"("proposalId", "createdAt");
CREATE INDEX IF NOT EXISTS "aura_shadow_receipts_proposalHash_idx" ON "aura_shadow_receipts"("proposalHash");

DO $$ BEGIN
  ALTER TABLE "aura_proposal_verifications_wave3" ADD CONSTRAINT "aura_proposal_verifications_wave3_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "aura_action_proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "aura_proposal_reviews" ADD CONSTRAINT "aura_proposal_reviews_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "aura_action_proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "aura_proposal_reviews" ADD CONSTRAINT "aura_proposal_reviews_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "aura_shadow_evaluations" ADD CONSTRAINT "aura_shadow_evaluations_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "aura_action_proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "aura_shadow_receipts" ADD CONSTRAINT "aura_shadow_receipts_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "aura_action_proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
