-- ContinuityOS foundation + CareOS mission spine (additive, fail-closed)
-- Rollback: disable MAPABLE_CONTINUITY_OS_ENABLED; tables may remain empty.

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

CREATE TABLE IF NOT EXISTS "life_event_mission_extensions" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "typeKey" TEXT NOT NULL,
    "typeVersion" TEXT NOT NULL,
    "participantGoal" TEXT NOT NULL,
    "participantWording" TEXT NOT NULL DEFAULT '',
    "desiredDate" TIMESTAMP(3),
    "continuityStatus" TEXT NOT NULL DEFAULT 'draft',
    "preferencesJson" JSONB NOT NULL DEFAULT '{}',
    "unknownsJson" JSONB NOT NULL DEFAULT '[]',
    "blockersJson" JSONB NOT NULL DEFAULT '[]',
    "nonNegotiableRequirementsJson" JSONB NOT NULL DEFAULT '[]',
    "privacyMode" TEXT NOT NULL DEFAULT 'standard',
    "templateWarningsJson" JSONB NOT NULL DEFAULT '[]',
    "prohibitedAutomatedDecisionsJson" JSONB NOT NULL DEFAULT '[]',
    "stoppedAt" TIMESTAMP(3),
    "stopReason" TEXT,
    "reviewDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "life_event_mission_extensions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "life_event_mission_extensions_missionId_key" ON "life_event_mission_extensions"("missionId");
CREATE INDEX IF NOT EXISTS "life_event_mission_extensions_typeKey_typeVersion_idx" ON "life_event_mission_extensions"("typeKey", "typeVersion");
CREATE INDEX IF NOT EXISTS "life_event_mission_extensions_continuityStatus_idx" ON "life_event_mission_extensions"("continuityStatus");

CREATE TABLE IF NOT EXISTS "continuity_assessments" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "assessmentType" TEXT NOT NULL DEFAULT 'pre_mortem',
    "findingsJson" JSONB NOT NULL DEFAULT '{}',
    "singlePointsOfFailureJson" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "continuity_assessments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "continuity_assessments_missionId_createdAt_idx" ON "continuity_assessments"("missionId", "createdAt");
CREATE INDEX IF NOT EXISTS "continuity_assessments_participantId_createdAt_idx" ON "continuity_assessments"("participantId", "createdAt");

CREATE TABLE IF NOT EXISTS "service_failures" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evidence" TEXT,
    "confidence" TEXT NOT NULL,
    "urgency" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "affectedDependencyId" TEXT,
    "verificationRequirement" TEXT NOT NULL,
    "rawSummary" TEXT NOT NULL,
    "failureClass" TEXT,
    "severity" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'unverified',
    "playbookKeysJson" JSONB NOT NULL DEFAULT '[]',
    "signalsJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_failures_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "service_failures_missionId_createdAt_idx" ON "service_failures"("missionId", "createdAt");
CREATE INDEX IF NOT EXISTS "service_failures_participantId_createdAt_idx" ON "service_failures"("participantId", "createdAt");
CREATE INDEX IF NOT EXISTS "service_failures_failureClass_severity_idx" ON "service_failures"("failureClass", "severity");

CREATE TABLE IF NOT EXISTS "service_failure_impacts" (
    "id" TEXT NOT NULL,
    "failureId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "impactJson" JSONB NOT NULL DEFAULT '{}',
    "priorPlanJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_failure_impacts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "service_failure_impacts_failureId_version_key" ON "service_failure_impacts"("failureId", "version");
CREATE INDEX IF NOT EXISTS "service_failure_impacts_failureId_idx" ON "service_failure_impacts"("failureId");

CREATE TABLE IF NOT EXISTS "recovery_cases" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "failureId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "playbookKey" TEXT NOT NULL,
    "shadowOnly" BOOLEAN NOT NULL DEFAULT true,
    "impactVersion" INTEGER NOT NULL DEFAULT 1,
    "optionsJson" JSONB NOT NULL DEFAULT '[]',
    "selectedOptionId" TEXT,
    "proposalJson" JSONB,
    "ownerRole" TEXT NOT NULL DEFAULT 'navigator',
    "outcome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recovery_cases_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "recovery_cases_missionId_status_idx" ON "recovery_cases"("missionId", "status");
CREATE INDEX IF NOT EXISTS "recovery_cases_participantId_createdAt_idx" ON "recovery_cases"("participantId", "createdAt");
CREATE INDEX IF NOT EXISTS "recovery_cases_failureId_idx" ON "recovery_cases"("failureId");

CREATE TABLE IF NOT EXISTS "recovery_escalations" (
    "id" TEXT NOT NULL,
    "recoveryCaseId" TEXT NOT NULL,
    "destinationRole" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "fieldMinimisationJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recovery_escalations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "recovery_escalations_recoveryCaseId_createdAt_idx" ON "recovery_escalations"("recoveryCaseId", "createdAt");

CREATE TABLE IF NOT EXISTS "recovery_handoffs" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "recoveryCaseId" TEXT,
    "participantId" TEXT NOT NULL,
    "sendingOrganisation" TEXT NOT NULL,
    "receivingOrganisation" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "tasksJson" JSONB NOT NULL DEFAULT '[]',
    "participantApprovedFieldsJson" JSONB NOT NULL DEFAULT '[]',
    "informationOmittedJson" JSONB NOT NULL DEFAULT '[]',
    "state" TEXT NOT NULL DEFAULT 'draft',
    "unresolvedItemsJson" JSONB NOT NULL DEFAULT '[]',
    "fallback" TEXT,
    "serviceCommitment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recovery_handoffs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "recovery_handoffs_missionId_state_idx" ON "recovery_handoffs"("missionId", "state");
CREATE INDEX IF NOT EXISTS "recovery_handoffs_participantId_createdAt_idx" ON "recovery_handoffs"("participantId", "createdAt");
CREATE INDEX IF NOT EXISTS "recovery_handoffs_recoveryCaseId_idx" ON "recovery_handoffs"("recoveryCaseId");

CREATE TABLE IF NOT EXISTS "recovery_receipts" (
    "id" TEXT NOT NULL,
    "recoveryCaseId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "receiptJson" JSONB NOT NULL,
    "outcome" TEXT NOT NULL,
    "falseRecovery" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recovery_receipts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "recovery_receipts_recoveryCaseId_idx" ON "recovery_receipts"("recoveryCaseId");
CREATE INDEX IF NOT EXISTS "recovery_receipts_participantId_createdAt_idx" ON "recovery_receipts"("participantId", "createdAt");

-- Foreign keys (additive; ignore if already present in some environments)
DO $$ BEGIN
  ALTER TABLE "careos_missions" ADD CONSTRAINT "careos_missions_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "careos_mission_events" ADD CONSTRAINT "careos_mission_events_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "careos_missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "careos_mission_events" ADD CONSTRAINT "careos_mission_events_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "life_event_mission_extensions" ADD CONSTRAINT "life_event_mission_extensions_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "careos_missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "continuity_assessments" ADD CONSTRAINT "continuity_assessments_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "careos_missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "continuity_assessments" ADD CONSTRAINT "continuity_assessments_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "service_failures" ADD CONSTRAINT "service_failures_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "careos_missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "service_failures" ADD CONSTRAINT "service_failures_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "service_failure_impacts" ADD CONSTRAINT "service_failure_impacts_failureId_fkey" FOREIGN KEY ("failureId") REFERENCES "service_failures"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "recovery_cases" ADD CONSTRAINT "recovery_cases_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "careos_missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "recovery_cases" ADD CONSTRAINT "recovery_cases_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "recovery_cases" ADD CONSTRAINT "recovery_cases_failureId_fkey" FOREIGN KEY ("failureId") REFERENCES "service_failures"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "recovery_escalations" ADD CONSTRAINT "recovery_escalations_recoveryCaseId_fkey" FOREIGN KEY ("recoveryCaseId") REFERENCES "recovery_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "recovery_handoffs" ADD CONSTRAINT "recovery_handoffs_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "careos_missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "recovery_handoffs" ADD CONSTRAINT "recovery_handoffs_recoveryCaseId_fkey" FOREIGN KEY ("recoveryCaseId") REFERENCES "recovery_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "recovery_handoffs" ADD CONSTRAINT "recovery_handoffs_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "recovery_receipts" ADD CONSTRAINT "recovery_receipts_recoveryCaseId_fkey" FOREIGN KEY ("recoveryCaseId") REFERENCES "recovery_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "recovery_receipts" ADD CONSTRAINT "recovery_receipts_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
