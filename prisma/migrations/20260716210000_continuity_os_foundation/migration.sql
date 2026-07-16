-- CreateTable
CREATE TABLE "careos_missions" (
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
    "stopState" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "careos_missions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "careos_mission_events" (
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

-- CreateTable
CREATE TABLE "life_event_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "life_event_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "life_event_type_versions" (
    "id" TEXT NOT NULL,
    "lifeEventTypeId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "definitionJson" JSONB NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supersededAt" TIMESTAMP(3),
    "reviewOwner" TEXT NOT NULL,
    "policySourceKeys" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "life_event_type_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "life_event_mission_extensions" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "lifeEventTypeVersionId" TEXT NOT NULL,
    "lifeEventTypeCode" TEXT NOT NULL,
    "participantGoal" TEXT NOT NULL,
    "participantWording" TEXT NOT NULL DEFAULT '',
    "targetState" TEXT NOT NULL DEFAULT '',
    "currentState" TEXT NOT NULL DEFAULT 'draft',
    "selectedPassportId" TEXT,
    "privacyMode" TEXT NOT NULL DEFAULT 'standard',
    "desiredTiming" TIMESTAMP(3),
    "eventHorizon" TEXT NOT NULL DEFAULT 'medium_term',
    "unknownsJson" JSONB NOT NULL DEFAULT '[]',
    "blockersJson" JSONB NOT NULL DEFAULT '[]',
    "valuesJson" JSONB NOT NULL DEFAULT '{}',
    "nonNegotiableJson" JSONB NOT NULL DEFAULT '[]',
    "preferredSupportJson" JSONB NOT NULL DEFAULT '[]',
    "humanHelpRequested" BOOLEAN NOT NULL DEFAULT false,
    "safetyConcern" BOOLEAN NOT NULL DEFAULT false,
    "contingencyPlaybookIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reviewDate" TIMESTAMP(3),
    "activatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "life_event_mission_extensions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "life_event_milestones" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "ownerRole" TEXT NOT NULL,
    "ownerUserId" TEXT,
    "dueAt" TIMESTAMP(3),
    "dependsOnJson" JSONB NOT NULL DEFAULT '[]',
    "evidenceJson" JSONB NOT NULL DEFAULT '[]',
    "authority" TEXT NOT NULL DEFAULT 'participant',
    "fallbackJson" JSONB NOT NULL DEFAULT '{}',
    "expiresAt" TIMESTAMP(3),
    "escalationRole" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "life_event_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "continuity_preferences" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "preferenceKey" TEXT NOT NULL,
    "valueJson" JSONB NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'participant_confirmed',
    "status" TEXT NOT NULL DEFAULT 'active',
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "continuity_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "continuity_dependency_snapshots" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "nodesJson" JSONB NOT NULL DEFAULT '[]',
    "edgesJson" JSONB NOT NULL DEFAULT '[]',
    "responsibilitiesJson" JSONB NOT NULL DEFAULT '[]',
    "unknownsJson" JSONB NOT NULL DEFAULT '[]',
    "blockersJson" JSONB NOT NULL DEFAULT '[]',
    "priorPlanRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "continuity_dependency_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "continuity_assessments" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "assessmentType" TEXT NOT NULL DEFAULT 'pre_mortem',
    "level" TEXT NOT NULL,
    "singlePointsOfFailureJson" JSONB NOT NULL DEFAULT '[]',
    "unconfirmedJson" JSONB NOT NULL DEFAULT '[]',
    "staleEvidenceJson" JSONB NOT NULL DEFAULT '[]',
    "timingConflictsJson" JSONB NOT NULL DEFAULT '[]',
    "missingAlternativesJson" JSONB NOT NULL DEFAULT '[]',
    "recoveryOptionsJson" JSONB NOT NULL DEFAULT '[]',
    "humanReviewNeedsJson" JSONB NOT NULL DEFAULT '[]',
    "participantActionsJson" JSONB NOT NULL DEFAULT '[]',
    "nonAiContactsJson" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "continuity_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_failures" (
    "id" TEXT NOT NULL,
    "missionId" TEXT,
    "participantId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'signal_received',
    "failureClass" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'attention',
    "serviceDomain" TEXT NOT NULL,
    "serviceRefType" TEXT,
    "serviceRefId" TEXT,
    "summary" TEXT NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "impactVersion" INTEGER NOT NULL DEFAULT 0,
    "priorPlanSnapshotId" TEXT,
    "incidentReportId" TEXT,
    "stopHonoured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_failures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_failure_signals" (
    "id" TEXT NOT NULL,
    "serviceFailureId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT,
    "sourceLabel" TEXT,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evidenceJson" JSONB NOT NULL DEFAULT '{}',
    "confidence" TEXT NOT NULL DEFAULT 'unverified',
    "urgency" TEXT NOT NULL DEFAULT 'attention',
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "affectedDependencyCode" TEXT,
    "verificationRequirement" TEXT NOT NULL DEFAULT 'human_or_canonical_event',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_failure_signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_failure_impacts" (
    "id" TEXT NOT NULL,
    "serviceFailureId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "affectedDepsJson" JSONB NOT NULL DEFAULT '[]',
    "timingImpactJson" JSONB NOT NULL DEFAULT '{}',
    "accessibilityImpactJson" JSONB NOT NULL DEFAULT '{}',
    "disclosureImpactJson" JSONB NOT NULL DEFAULT '{}',
    "financialImpactJson" JSONB NOT NULL DEFAULT '{}',
    "noticeListJson" JSONB NOT NULL DEFAULT '[]',
    "alternativesJson" JSONB NOT NULL DEFAULT '[]',
    "priorPlanPreserved" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_failure_impacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recovery_cases" (
    "id" TEXT NOT NULL,
    "missionId" TEXT,
    "participantId" TEXT NOT NULL,
    "serviceFailureId" TEXT,
    "playbookCode" TEXT,
    "playbookVersion" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "originalGoal" TEXT NOT NULL,
    "horizon" TEXT NOT NULL DEFAULT 'immediate',
    "selectedOptionId" TEXT,
    "ownerRole" TEXT NOT NULL DEFAULT 'participant',
    "ownerUserId" TEXT,
    "stopState" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recovery_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recovery_options" (
    "id" TEXT NOT NULL,
    "recoveryCaseId" TEXT NOT NULL,
    "optionKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "availabilityState" TEXT NOT NULL DEFAULT 'requires_confirmation',
    "preservesOriginalGoal" BOOLEAN NOT NULL DEFAULT true,
    "hardRequirementsMet" BOOLEAN NOT NULL DEFAULT true,
    "excludedReason" TEXT,
    "unknownsJson" JSONB NOT NULL DEFAULT '[]',
    "disclosureJson" JSONB NOT NULL DEFAULT '{}',
    "peopleJson" JSONB NOT NULL DEFAULT '[]',
    "timingJson" JSONB NOT NULL DEFAULT '{}',
    "costJson" JSONB NOT NULL DEFAULT '{}',
    "preferenceMatchJson" JSONB NOT NULL DEFAULT '{}',
    "evidenceConfidence" TEXT NOT NULL DEFAULT 'unverified',
    "approvalsRequiredJson" JSONB NOT NULL DEFAULT '[]',
    "fallbackJson" JSONB NOT NULL DEFAULT '{}',
    "horizon" TEXT NOT NULL DEFAULT 'immediate',
    "expiresAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recovery_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recovery_decisions" (
    "id" TEXT NOT NULL,
    "recoveryCaseId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "decidedByUserId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "rationale" TEXT,
    "approvalHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recovery_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recovery_action_links" (
    "id" TEXT NOT NULL,
    "recoveryCaseId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "applicationService" TEXT NOT NULL,
    "auraProposalId" TEXT,
    "auraExecutionId" TEXT,
    "domainEntityType" TEXT,
    "domainEntityId" TEXT,
    "state" TEXT NOT NULL DEFAULT 'queued',
    "idempotencyKey" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recovery_action_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recovery_handoffs" (
    "id" TEXT NOT NULL,
    "recoveryCaseId" TEXT,
    "missionId" TEXT,
    "sendingOrganisationId" TEXT,
    "receivingOrganisationId" TEXT,
    "sendingRole" TEXT NOT NULL,
    "receivingRole" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "tasksJson" JSONB NOT NULL DEFAULT '[]',
    "approvedFieldsJson" JSONB NOT NULL DEFAULT '[]',
    "omittedFieldsJson" JSONB NOT NULL DEFAULT '[]',
    "deadlineAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "unresolvedJson" JSONB NOT NULL DEFAULT '[]',
    "fallbackJson" JSONB NOT NULL DEFAULT '{}',
    "receiptJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recovery_handoffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recovery_escalations" (
    "id" TEXT NOT NULL,
    "recoveryCaseId" TEXT NOT NULL,
    "destinationRole" TEXT NOT NULL,
    "organisationHint" TEXT,
    "purpose" TEXT NOT NULL,
    "fieldsSharedJson" JSONB NOT NULL DEFAULT '[]',
    "queueState" TEXT NOT NULL DEFAULT 'queued',
    "highRisk" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recovery_escalations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recovery_receipts" (
    "id" TEXT NOT NULL,
    "recoveryCaseId" TEXT NOT NULL,
    "originalGoal" TEXT NOT NULL,
    "failureSummary" TEXT NOT NULL,
    "optionSelectedJson" JSONB NOT NULL DEFAULT '{}',
    "participantApprovalJson" JSONB NOT NULL DEFAULT '{}',
    "actionsTakenJson" JSONB NOT NULL DEFAULT '[]',
    "recordsCreatedJson" JSONB NOT NULL DEFAULT '[]',
    "communicationsJson" JSONB NOT NULL DEFAULT '[]',
    "handoffsJson" JSONB NOT NULL DEFAULT '[]',
    "postconditionsJson" JSONB NOT NULL DEFAULT '[]',
    "remainingUnknownsJson" JSONB NOT NULL DEFAULT '[]',
    "financialEffectsJson" JSONB NOT NULL DEFAULT '{}',
    "complaintRoutesJson" JSONB NOT NULL DEFAULT '[]',
    "finalOutcome" TEXT NOT NULL,
    "evidenceJson" JSONB NOT NULL DEFAULT '[]',
    "limitationsJson" JSONB NOT NULL DEFAULT '[]',
    "serviceActionCompleted" BOOLEAN NOT NULL DEFAULT false,
    "realWorldOutcomeConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "participantGoalAchieved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recovery_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recovery_postconditions" (
    "id" TEXT NOT NULL,
    "recoveryCaseId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "evidenceJson" JSONB NOT NULL DEFAULT '{}',
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recovery_postconditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recovery_outcomes" (
    "id" TEXT NOT NULL,
    "recoveryCaseId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "evidenceJson" JSONB NOT NULL DEFAULT '[]',
    "falseRecovery" BOOLEAN NOT NULL DEFAULT false,
    "recordedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recovery_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_friction_events" (
    "id" TEXT NOT NULL,
    "missionId" TEXT,
    "participantId" TEXT NOT NULL,
    "sourceService" TEXT NOT NULL,
    "organisationId" TEXT,
    "workflow" TEXT NOT NULL,
    "cause" TEXT NOT NULL,
    "participantActionRequired" BOOLEAN NOT NULL DEFAULT false,
    "timeBurdenMinutes" INTEGER NOT NULL DEFAULT 0,
    "travelBurdenKm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "disclosureBurden" TEXT NOT NULL DEFAULT 'none',
    "financialBurdenCents" INTEGER NOT NULL DEFAULT 0,
    "accessibilityBurden" TEXT NOT NULL DEFAULT 'none',
    "avoidable" BOOLEAN NOT NULL DEFAULT true,
    "evidenceJson" JSONB NOT NULL DEFAULT '{}',
    "remediationOwner" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_friction_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recovery_learning_reviews" (
    "id" TEXT NOT NULL,
    "missionId" TEXT,
    "recoveryCaseId" TEXT,
    "findingType" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "proposalJson" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "accessibilityOpsLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recovery_learning_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "continuity_playbooks" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "continuity_playbooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "continuity_playbook_versions" (
    "id" TEXT NOT NULL,
    "playbookId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "definitionJson" JSONB NOT NULL,
    "reviewOwner" TEXT NOT NULL,
    "reviewDate" TIMESTAMP(3),
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supersededAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "continuity_playbook_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "careos_missions_requestId_key" ON "careos_missions"("requestId");

-- CreateIndex
CREATE INDEX "careos_missions_participantId_createdAt_idx" ON "careos_missions"("participantId", "createdAt");

-- CreateIndex
CREATE INDEX "careos_missions_tenantId_status_idx" ON "careos_missions"("tenantId", "status");

-- CreateIndex
CREATE INDEX "careos_missions_correlationId_idx" ON "careos_missions"("correlationId");

-- CreateIndex
CREATE INDEX "careos_missions_missionType_status_idx" ON "careos_missions"("missionType", "status");

-- CreateIndex
CREATE INDEX "careos_mission_events_missionId_createdAt_idx" ON "careos_mission_events"("missionId", "createdAt");

-- CreateIndex
CREATE INDEX "careos_mission_events_participantId_createdAt_idx" ON "careos_mission_events"("participantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "careos_mission_events_missionId_eventKey_key" ON "careos_mission_events"("missionId", "eventKey");

-- CreateIndex
CREATE UNIQUE INDEX "life_event_types_code_key" ON "life_event_types"("code");

-- CreateIndex
CREATE INDEX "life_event_types_category_active_idx" ON "life_event_types"("category", "active");

-- CreateIndex
CREATE INDEX "life_event_type_versions_effectiveFrom_idx" ON "life_event_type_versions"("effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "life_event_type_versions_lifeEventTypeId_version_key" ON "life_event_type_versions"("lifeEventTypeId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "life_event_mission_extensions_missionId_key" ON "life_event_mission_extensions"("missionId");

-- CreateIndex
CREATE INDEX "life_event_mission_extensions_participantId_currentState_idx" ON "life_event_mission_extensions"("participantId", "currentState");

-- CreateIndex
CREATE INDEX "life_event_mission_extensions_lifeEventTypeCode_createdAt_idx" ON "life_event_mission_extensions"("lifeEventTypeCode", "createdAt");

-- CreateIndex
CREATE INDEX "life_event_milestones_missionId_status_idx" ON "life_event_milestones"("missionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "life_event_milestones_missionId_code_key" ON "life_event_milestones"("missionId", "code");

-- CreateIndex
CREATE INDEX "continuity_preferences_participantId_status_idx" ON "continuity_preferences"("participantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "continuity_preferences_participantId_preferenceKey_key" ON "continuity_preferences"("participantId", "preferenceKey");

-- CreateIndex
CREATE INDEX "continuity_dependency_snapshots_missionId_createdAt_idx" ON "continuity_dependency_snapshots"("missionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "continuity_dependency_snapshots_missionId_version_key" ON "continuity_dependency_snapshots"("missionId", "version");

-- CreateIndex
CREATE INDEX "continuity_assessments_missionId_createdAt_idx" ON "continuity_assessments"("missionId", "createdAt");

-- CreateIndex
CREATE INDEX "service_failures_participantId_status_idx" ON "service_failures"("participantId", "status");

-- CreateIndex
CREATE INDEX "service_failures_missionId_createdAt_idx" ON "service_failures"("missionId", "createdAt");

-- CreateIndex
CREATE INDEX "service_failures_failureClass_severity_idx" ON "service_failures"("failureClass", "severity");

-- CreateIndex
CREATE INDEX "service_failure_signals_serviceFailureId_receivedAt_idx" ON "service_failure_signals"("serviceFailureId", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "service_failure_impacts_serviceFailureId_version_key" ON "service_failure_impacts"("serviceFailureId", "version");

-- CreateIndex
CREATE INDEX "recovery_cases_participantId_status_idx" ON "recovery_cases"("participantId", "status");

-- CreateIndex
CREATE INDEX "recovery_cases_missionId_createdAt_idx" ON "recovery_cases"("missionId", "createdAt");

-- CreateIndex
CREATE INDEX "recovery_cases_serviceFailureId_idx" ON "recovery_cases"("serviceFailureId");

-- CreateIndex
CREATE INDEX "recovery_options_recoveryCaseId_availabilityState_idx" ON "recovery_options"("recoveryCaseId", "availabilityState");

-- CreateIndex
CREATE UNIQUE INDEX "recovery_options_recoveryCaseId_optionKey_key" ON "recovery_options"("recoveryCaseId", "optionKey");

-- CreateIndex
CREATE INDEX "recovery_decisions_recoveryCaseId_createdAt_idx" ON "recovery_decisions"("recoveryCaseId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "recovery_action_links_idempotencyKey_key" ON "recovery_action_links"("idempotencyKey");

-- CreateIndex
CREATE INDEX "recovery_action_links_recoveryCaseId_state_idx" ON "recovery_action_links"("recoveryCaseId", "state");

-- CreateIndex
CREATE INDEX "recovery_handoffs_recoveryCaseId_status_idx" ON "recovery_handoffs"("recoveryCaseId", "status");

-- CreateIndex
CREATE INDEX "recovery_handoffs_missionId_status_idx" ON "recovery_handoffs"("missionId", "status");

-- CreateIndex
CREATE INDEX "recovery_escalations_recoveryCaseId_createdAt_idx" ON "recovery_escalations"("recoveryCaseId", "createdAt");

-- CreateIndex
CREATE INDEX "recovery_receipts_recoveryCaseId_createdAt_idx" ON "recovery_receipts"("recoveryCaseId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "recovery_postconditions_recoveryCaseId_code_key" ON "recovery_postconditions"("recoveryCaseId", "code");

-- CreateIndex
CREATE INDEX "recovery_outcomes_recoveryCaseId_createdAt_idx" ON "recovery_outcomes"("recoveryCaseId", "createdAt");

-- CreateIndex
CREATE INDEX "access_friction_events_participantId_createdAt_idx" ON "access_friction_events"("participantId", "createdAt");

-- CreateIndex
CREATE INDEX "access_friction_events_sourceService_createdAt_idx" ON "access_friction_events"("sourceService", "createdAt");

-- CreateIndex
CREATE INDEX "access_friction_events_missionId_idx" ON "access_friction_events"("missionId");

-- CreateIndex
CREATE INDEX "recovery_learning_reviews_status_createdAt_idx" ON "recovery_learning_reviews"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "continuity_playbooks_code_key" ON "continuity_playbooks"("code");

-- CreateIndex
CREATE UNIQUE INDEX "continuity_playbook_versions_playbookId_version_key" ON "continuity_playbook_versions"("playbookId", "version");

-- AddForeignKey
ALTER TABLE "careos_missions" ADD CONSTRAINT "careos_missions_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "careos_mission_events" ADD CONSTRAINT "careos_mission_events_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "careos_missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "careos_mission_events" ADD CONSTRAINT "careos_mission_events_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "life_event_type_versions" ADD CONSTRAINT "life_event_type_versions_lifeEventTypeId_fkey" FOREIGN KEY ("lifeEventTypeId") REFERENCES "life_event_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "life_event_mission_extensions" ADD CONSTRAINT "life_event_mission_extensions_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "careos_missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "life_event_mission_extensions" ADD CONSTRAINT "life_event_mission_extensions_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "life_event_mission_extensions" ADD CONSTRAINT "life_event_mission_extensions_lifeEventTypeVersionId_fkey" FOREIGN KEY ("lifeEventTypeVersionId") REFERENCES "life_event_type_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "life_event_milestones" ADD CONSTRAINT "life_event_milestones_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "careos_missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "continuity_preferences" ADD CONSTRAINT "continuity_preferences_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "continuity_dependency_snapshots" ADD CONSTRAINT "continuity_dependency_snapshots_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "careos_missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "continuity_assessments" ADD CONSTRAINT "continuity_assessments_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "careos_missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_failures" ADD CONSTRAINT "service_failures_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "careos_missions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_failures" ADD CONSTRAINT "service_failures_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_failure_signals" ADD CONSTRAINT "service_failure_signals_serviceFailureId_fkey" FOREIGN KEY ("serviceFailureId") REFERENCES "service_failures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_failure_impacts" ADD CONSTRAINT "service_failure_impacts_serviceFailureId_fkey" FOREIGN KEY ("serviceFailureId") REFERENCES "service_failures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery_cases" ADD CONSTRAINT "recovery_cases_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "careos_missions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery_cases" ADD CONSTRAINT "recovery_cases_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery_cases" ADD CONSTRAINT "recovery_cases_serviceFailureId_fkey" FOREIGN KEY ("serviceFailureId") REFERENCES "service_failures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery_options" ADD CONSTRAINT "recovery_options_recoveryCaseId_fkey" FOREIGN KEY ("recoveryCaseId") REFERENCES "recovery_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery_decisions" ADD CONSTRAINT "recovery_decisions_recoveryCaseId_fkey" FOREIGN KEY ("recoveryCaseId") REFERENCES "recovery_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery_action_links" ADD CONSTRAINT "recovery_action_links_recoveryCaseId_fkey" FOREIGN KEY ("recoveryCaseId") REFERENCES "recovery_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery_handoffs" ADD CONSTRAINT "recovery_handoffs_recoveryCaseId_fkey" FOREIGN KEY ("recoveryCaseId") REFERENCES "recovery_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery_handoffs" ADD CONSTRAINT "recovery_handoffs_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "careos_missions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery_escalations" ADD CONSTRAINT "recovery_escalations_recoveryCaseId_fkey" FOREIGN KEY ("recoveryCaseId") REFERENCES "recovery_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery_receipts" ADD CONSTRAINT "recovery_receipts_recoveryCaseId_fkey" FOREIGN KEY ("recoveryCaseId") REFERENCES "recovery_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery_postconditions" ADD CONSTRAINT "recovery_postconditions_recoveryCaseId_fkey" FOREIGN KEY ("recoveryCaseId") REFERENCES "recovery_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery_outcomes" ADD CONSTRAINT "recovery_outcomes_recoveryCaseId_fkey" FOREIGN KEY ("recoveryCaseId") REFERENCES "recovery_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_friction_events" ADD CONSTRAINT "access_friction_events_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "careos_missions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_friction_events" ADD CONSTRAINT "access_friction_events_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery_learning_reviews" ADD CONSTRAINT "recovery_learning_reviews_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "careos_missions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "continuity_playbook_versions" ADD CONSTRAINT "continuity_playbook_versions_playbookId_fkey" FOREIGN KEY ("playbookId") REFERENCES "continuity_playbooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

