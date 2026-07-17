-- MapAble AURA Wave 1: CareOSMission spine + AURA extension tables
-- Expand-only; rollback by disabling MAPABLE_AURA_ENABLED and ignoring tables.

CREATE TABLE IF NOT EXISTS "careos_missions" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "tenantId" TEXT,
    "requestId" TEXT NOT NULL,
    "missionType" TEXT NOT NULL,
    "desiredOutcome" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "authorityDecisionId" TEXT,
    "inputSummary" JSONB NOT NULL DEFAULT '{}',
    "graphJson" JSONB NOT NULL DEFAULT '{}',
    "modulesJson" JSONB NOT NULL DEFAULT '[]',
    "alertsJson" JSONB NOT NULL DEFAULT '[]',
    "proposalsJson" JSONB NOT NULL DEFAULT '[]',
    "stateVersion" INTEGER NOT NULL DEFAULT 1,
    "correlationId" TEXT NOT NULL,
    "workflowRunId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "careos_missions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "careos_missions_requestId_key" ON "careos_missions"("requestId");
CREATE INDEX IF NOT EXISTS "careos_missions_participantId_createdAt_idx" ON "careos_missions"("participantId", "createdAt");
CREATE INDEX IF NOT EXISTS "careos_missions_tenantId_status_idx" ON "careos_missions"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "careos_missions_correlationId_idx" ON "careos_missions"("correlationId");
CREATE INDEX IF NOT EXISTS "careos_missions_missionType_status_idx" ON "careos_missions"("missionType", "status");

CREATE TABLE IF NOT EXISTS "careos_mission_events" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "sourceModule" TEXT NOT NULL,
    "sourceEntityId" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'information',
    "summary" TEXT NOT NULL,
    "payloadJson" JSONB,
    "eventKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "careos_mission_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "careos_mission_events_missionId_eventKey_key" ON "careos_mission_events"("missionId", "eventKey");
CREATE INDEX IF NOT EXISTS "careos_mission_events_missionId_createdAt_idx" ON "careos_mission_events"("missionId", "createdAt");
CREATE INDEX IF NOT EXISTS "careos_mission_events_participantId_createdAt_idx" ON "careos_mission_events"("participantId", "createdAt");

CREATE TABLE IF NOT EXISTS "aura_mission_extensions" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "selectedPassportId" TEXT,
    "authorityLevel" TEXT NOT NULL DEFAULT 'L2_RECOMMEND',
    "stopState" BOOLEAN NOT NULL DEFAULT false,
    "proofPlanVersion" INTEGER NOT NULL DEFAULT 0,
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "aura_mission_extensions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "aura_mission_extensions_missionId_key" ON "aura_mission_extensions"("missionId");
CREATE INDEX IF NOT EXISTS "aura_mission_extensions_stopState_idx" ON "aura_mission_extensions"("stopState");

CREATE TABLE IF NOT EXISTS "aura_capability_leases" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "capabilityId" TEXT NOT NULL,
    "authority" TEXT NOT NULL,
    "resourceScope" JSONB NOT NULL DEFAULT '[]',
    "fieldScope" JSONB NOT NULL DEFAULT '[]',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revocationReason" TEXT,
    "correlationId" TEXT NOT NULL,
    CONSTRAINT "aura_capability_leases_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "aura_capability_leases_missionId_revokedAt_idx" ON "aura_capability_leases"("missionId", "revokedAt");
CREATE INDEX IF NOT EXISTS "aura_capability_leases_userId_expiresAt_idx" ON "aura_capability_leases"("userId", "expiresAt");
CREATE INDEX IF NOT EXISTS "aura_capability_leases_capabilityId_expiresAt_idx" ON "aura_capability_leases"("capabilityId", "expiresAt");

CREATE TABLE IF NOT EXISTS "aura_plan_artifacts" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "structuredPlan" JSONB NOT NULL,
    "verifierStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "aura_plan_artifacts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "aura_plan_artifacts_missionId_version_idx" ON "aura_plan_artifacts"("missionId", "version");

CREATE TABLE IF NOT EXISTS "aura_plan_evidence_links" (
    "id" TEXT NOT NULL,
    "planArtifactId" TEXT NOT NULL,
    "evidenceType" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "sourceVersion" TEXT,
    CONSTRAINT "aura_plan_evidence_links_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "aura_plan_evidence_links_planArtifactId_idx" ON "aura_plan_evidence_links"("planArtifactId");
CREATE INDEX IF NOT EXISTS "aura_plan_evidence_links_evidenceId_idx" ON "aura_plan_evidence_links"("evidenceId");

CREATE TABLE IF NOT EXISTS "aura_plan_verifications" (
    "id" TEXT NOT NULL,
    "planArtifactId" TEXT NOT NULL,
    "verifierVersion" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "findings" JSONB NOT NULL DEFAULT '[]',
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "aura_plan_verifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "aura_plan_verifications_planArtifactId_checkedAt_idx" ON "aura_plan_verifications"("planArtifactId", "checkedAt");

CREATE TABLE IF NOT EXISTS "aura_action_proposals" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "applicationService" TEXT NOT NULL,
    "recipient" TEXT,
    "purpose" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "fieldsShared" JSONB NOT NULL DEFAULT '[]',
    "fieldsOmitted" JSONB NOT NULL DEFAULT '[]',
    "proposalHash" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "aura_action_proposals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "aura_action_proposals_idempotencyKey_key" ON "aura_action_proposals"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "aura_action_proposals_missionId_state_idx" ON "aura_action_proposals"("missionId", "state");
CREATE INDEX IF NOT EXISTS "aura_action_proposals_proposalHash_idx" ON "aura_action_proposals"("proposalHash");

CREATE TABLE IF NOT EXISTS "aura_memory_cards" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "structuredPreference" JSONB,
    "purpose" TEXT,
    "modules" JSONB NOT NULL DEFAULT '[]',
    "source" TEXT NOT NULL DEFAULT 'participant',
    "expiresAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "aura_memory_cards_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "aura_memory_cards_userId_deletedAt_idx" ON "aura_memory_cards"("userId", "deletedAt");

CREATE TABLE IF NOT EXISTS "aura_outcome_records" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "outcomeType" TEXT NOT NULL,
    "structuredOutcome" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "aura_outcome_records_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "aura_outcome_records_missionId_createdAt_idx" ON "aura_outcome_records"("missionId", "createdAt");
CREATE INDEX IF NOT EXISTS "aura_outcome_records_participantId_createdAt_idx" ON "aura_outcome_records"("participantId", "createdAt");
