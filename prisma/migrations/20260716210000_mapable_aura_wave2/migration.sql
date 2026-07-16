-- MapAble AURA Wave 2 additive tables (counterfactuals, resilience, challenge,
-- stop receipts, offline packs, audit replay manifests).
-- Does not rewrite historical audit events. Runtime may remain in-memory until
-- MAPABLE_AURA_USE_PRISMA=true.

CREATE TABLE IF NOT EXISTS "aura_counterfactual_runs" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "basePlanArtifactId" TEXT NOT NULL,
    "mutationJson" JSONB NOT NULL,
    "beforeJson" JSONB NOT NULL,
    "afterJson" JSONB NOT NULL,
    "changeSummaryJson" JSONB NOT NULL,
    "simulated" BOOLEAN NOT NULL DEFAULT true,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    CONSTRAINT "aura_counterfactual_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "aura_resilience_assessments" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "planArtifactId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "dependenciesJson" JSONB NOT NULL DEFAULT '[]',
    "singlePointsOfFailure" JSONB NOT NULL DEFAULT '[]',
    "verifiedFallbacks" JSONB NOT NULL DEFAULT '[]',
    "unverifiedFallbacks" JSONB NOT NULL DEFAULT '[]',
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "aura_resilience_assessments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "aura_plan_challenges" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "planArtifactId" TEXT NOT NULL,
    "challengeVersion" INTEGER NOT NULL DEFAULT 1,
    "resultJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "aura_plan_challenges_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "aura_mission_stop_receipts" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "revokedLeaseIds" JSONB NOT NULL DEFAULT '[]',
    "cancelledRunIds" JSONB NOT NULL DEFAULT '[]',
    "invalidatedProposalIds" JSONB NOT NULL DEFAULT '[]',
    "result" TEXT NOT NULL,
    "auditCorrelationId" TEXT NOT NULL,
    "notesJson" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "aura_mission_stop_receipts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "aura_offline_visit_packs" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "planArtifactId" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "snapshotJson" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "staleAfter" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'current_snapshot',
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "aura_offline_visit_packs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "aura_audit_replay_manifests" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "firstSequence" INTEGER NOT NULL,
    "lastSequence" INTEGER NOT NULL,
    "rootHash" TEXT NOT NULL,
    "eventCount" INTEGER NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "verificationStatus" TEXT NOT NULL DEFAULT 'pending',
    "manifestJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "aura_audit_replay_manifests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "aura_counterfactual_runs_missionId_generatedAt_idx" ON "aura_counterfactual_runs"("missionId", "generatedAt");
CREATE INDEX IF NOT EXISTS "aura_counterfactual_runs_expiresAt_idx" ON "aura_counterfactual_runs"("expiresAt");
CREATE INDEX IF NOT EXISTS "aura_resilience_assessments_missionId_assessedAt_idx" ON "aura_resilience_assessments"("missionId", "assessedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "aura_plan_challenges_missionId_planArtifactId_challengeVersion_key" ON "aura_plan_challenges"("missionId", "planArtifactId", "challengeVersion");
CREATE INDEX IF NOT EXISTS "aura_plan_challenges_missionId_createdAt_idx" ON "aura_plan_challenges"("missionId", "createdAt");
CREATE INDEX IF NOT EXISTS "aura_mission_stop_receipts_missionId_completedAt_idx" ON "aura_mission_stop_receipts"("missionId", "completedAt");
CREATE INDEX IF NOT EXISTS "aura_mission_stop_receipts_requestedByUserId_createdAt_idx" ON "aura_mission_stop_receipts"("requestedByUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "aura_offline_visit_packs_missionId_generatedAt_idx" ON "aura_offline_visit_packs"("missionId", "generatedAt");
CREATE INDEX IF NOT EXISTS "aura_offline_visit_packs_ownerUserId_status_idx" ON "aura_offline_visit_packs"("ownerUserId", "status");
CREATE INDEX IF NOT EXISTS "aura_offline_visit_packs_status_staleAfter_idx" ON "aura_offline_visit_packs"("status", "staleAfter");
CREATE UNIQUE INDEX IF NOT EXISTS "aura_audit_replay_manifests_missionId_version_key" ON "aura_audit_replay_manifests"("missionId", "version");
CREATE INDEX IF NOT EXISTS "aura_audit_replay_manifests_missionId_createdAt_idx" ON "aura_audit_replay_manifests"("missionId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "aura_counterfactual_runs" ADD CONSTRAINT "aura_counterfactual_runs_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "careos_missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "aura_resilience_assessments" ADD CONSTRAINT "aura_resilience_assessments_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "careos_missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "aura_plan_challenges" ADD CONSTRAINT "aura_plan_challenges_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "careos_missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "aura_mission_stop_receipts" ADD CONSTRAINT "aura_mission_stop_receipts_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "careos_missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "aura_mission_stop_receipts" ADD CONSTRAINT "aura_mission_stop_receipts_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "aura_offline_visit_packs" ADD CONSTRAINT "aura_offline_visit_packs_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "careos_missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "aura_offline_visit_packs" ADD CONSTRAINT "aura_offline_visit_packs_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "aura_audit_replay_manifests" ADD CONSTRAINT "aura_audit_replay_manifests_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "careos_missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
