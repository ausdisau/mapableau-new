-- MapAble Wave 10: AURA — participant-controlled agent planning with bounded execution.
-- Forward-only. All new enums / models are additive. Wave 9 disclosure gateway,
-- consent-v2, wallet, and delegation semantics are preserved.
--
-- AURA is NOT sentient, NOT AGI, NOT a legal representative, NOT a medical
-- practitioner, NOT an NDIS planner, NOT a financial adviser, NOT a substitute
-- decision-maker. AURA cannot create self-goals, escalate its permissions,
-- modify safety policy, spawn unrestricted agents, or impersonate a participant
-- or delegate. Prohibited: autonomous claim/invoice/payment approval,
-- consent alteration, legal delegation, incident reportability decisions,
-- safeguarding closure, kill-switch release, production integration activation.
-- All participant data egress MUST still go via Wave 9 `discloseParticipantData`.
-- Wave 8 tenant context (Organisation.id) remains mandatory.

-- CreateEnum
CREATE TYPE "AuraAgentClassification" AS ENUM ('core', 'care', 'transport', 'jobs', 'access', 'billing_explain_only', 'evidence', 'recovery', 'specialist_other');

-- CreateEnum
CREATE TYPE "AuraAgentLifecycleStatus" AS ENUM ('draft', 'active', 'suspended', 'retired');

-- CreateEnum
CREATE TYPE "AuraAuthorityEnvelopeStatus" AS ENUM ('draft', 'active', 'suspended', 'revoked', 'expired');

-- CreateEnum
CREATE TYPE "AuraGoalStatus" AS ENUM ('draft', 'clarifying', 'ready', 'executing', 'paused', 'completed', 'abandoned', 'declined');

-- CreateEnum
CREATE TYPE "AuraGoalSource" AS ENUM ('participant', 'delegate', 'provider_referral', 'system_suggested');

-- CreateEnum
CREATE TYPE "AuraPlanStatus" AS ENUM ('draft', 'simulated', 'approved', 'executing', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "AuraPlanStepStatus" AS ENUM ('pending', 'ready', 'running', 'succeeded', 'failed', 'skipped', 'compensated');

-- CreateEnum
CREATE TYPE "AuraExecutionState" AS ENUM ('queued', 'running', 'waiting_approval', 'paused', 'completed', 'failed', 'execution_unknown', 'compensated', 'cancelled');

-- CreateEnum
CREATE TYPE "AuraStepExecutionState" AS ENUM ('pending', 'running', 'succeeded', 'failed', 'execution_unknown', 'compensated', 'skipped');

-- CreateEnum
CREATE TYPE "AuraActionRiskTier" AS ENUM ('low_readonly', 'low_readwrite', 'medium_reversible', 'high_irreversible', 'prohibited');

-- CreateEnum
CREATE TYPE "AuraApprovalStatus" AS ENUM ('pending', 'approved', 'rejected', 'expired', 'invalidated');

-- CreateEnum
CREATE TYPE "AuraApprovalKind" AS ENUM ('participant_step_confirm', 'provider_review', 'two_person_high_risk', 'safety_officer_override');

-- CreateEnum
CREATE TYPE "AuraMemoryScope" AS ENUM ('session', 'participant_persistent', 'operational', 'redacted');

-- CreateEnum
CREATE TYPE "AuraMemoryClass" AS ENUM ('preference', 'goal_history', 'interaction_summary', 'tool_output_reference', 'correction_note', 'prohibited');

-- CreateEnum
CREATE TYPE "AuraToolKind" AS ENUM ('internal_query', 'internal_action', 'mcp_external', 'a2a_external', 'human_handoff', 'simulator');

-- CreateEnum
CREATE TYPE "AuraToolStatus" AS ENUM ('draft', 'active', 'suspended', 'retired');

-- CreateEnum
CREATE TYPE "AuraHandoffKind" AS ENUM ('agent_to_agent', 'agent_to_human', 'human_to_agent', 'external_service');

-- CreateEnum
CREATE TYPE "AuraOutcomeSignal" AS ENUM ('confirmed_success', 'partial_success', 'declined_by_participant', 'no_action_needed', 'regression', 'failure', 'waiting_evidence');

-- CreateEnum
CREATE TYPE "AuraSafetyHoldReason" AS ENUM ('participant_paused', 'consent_withdrawn', 'kill_switch', 'safety_officer_hold', 'incident_declared', 'policy_breach');

-- CreateEnum
CREATE TYPE "AuraSafetyHoldStatus" AS ENUM ('active', 'released', 'expired');

-- CreateEnum
CREATE TYPE "AiModelProvider" AS ENUM ('disabled', 'simulator', 'internal', 'vendor_api');

-- CreateEnum
CREATE TYPE "AiPromptRole" AS ENUM ('system', 'user', 'assistant', 'tool', 'guardrail');

-- CreateEnum
CREATE TYPE "AiSystemInventoryStatus" AS ENUM ('proposed', 'active', 'retired');

-- CreateTable

CREATE TABLE "AuraAgentDefinition" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "classification" "AuraAgentClassification" NOT NULL,
    "status" "AuraAgentLifecycleStatus" NOT NULL DEFAULT 'draft',
    "description" TEXT NOT NULL,
    "ownerOrganisationId" TEXT,
    "currentManifestId" TEXT,
    "productionActivated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuraAgentDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuraAgentManifest" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "versionKey" TEXT NOT NULL,
    "promptBundleId" TEXT,
    "modelProfileId" TEXT,
    "toolAllowlist" JSONB NOT NULL DEFAULT '[]',
    "policyKey" TEXT NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "safetyDisclaimers" JSONB NOT NULL DEFAULT '[]',
    "supportedActions" JSONB NOT NULL DEFAULT '[]',
    "productionActivated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuraAgentManifest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuraAuthorityEnvelope" (
    "id" TEXT NOT NULL,
    "subjectUserId" TEXT NOT NULL,
    "grantedByUserId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "status" "AuraAuthorityEnvelopeStatus" NOT NULL DEFAULT 'draft',
    "scopePermissions" JSONB NOT NULL DEFAULT '[]',
    "allowedActionSlugs" JSONB NOT NULL DEFAULT '[]',
    "allowedToolIds" JSONB NOT NULL DEFAULT '[]',
    "financialCapDollars" INTEGER,
    "perActionFinancialCapDollars" INTEGER,
    "perSessionCallCap" INTEGER,
    "perDayCallCap" INTEGER,
    "requiresParticipantEachTime" BOOLEAN NOT NULL DEFAULT false,
    "humanReviewAtOrAboveRiskTier" "AuraActionRiskTier" NOT NULL DEFAULT 'medium_reversible',
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveUntil" TIMESTAMP(3),
    "organisationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "revocationReason" TEXT,

    CONSTRAINT "AuraAuthorityEnvelope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuraActionDefinition" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "riskTier" "AuraActionRiskTier" NOT NULL,
    "prohibited" BOOLEAN NOT NULL DEFAULT false,
    "requiresConsent" BOOLEAN NOT NULL DEFAULT true,
    "requiredPermissions" JSONB NOT NULL DEFAULT '[]',
    "compensationRefSlug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuraActionDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuraGoal" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "agentId" TEXT,
    "authorityEnvelopeId" TEXT,
    "source" "AuraGoalSource" NOT NULL DEFAULT 'participant',
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "clarificationsJson" JSONB NOT NULL DEFAULT '[]',
    "status" "AuraGoalStatus" NOT NULL DEFAULT 'draft',
    "organisationId" TEXT,
    "lastParticipantSignalAt" TIMESTAMP(3),
    "abandonedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuraGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuraPlan" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "status" "AuraPlanStatus" NOT NULL DEFAULT 'draft',
    "planGraph" JSONB NOT NULL DEFAULT '{}',
    "inputHash" TEXT NOT NULL,
    "simulationRunId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuraPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuraPlanStep" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "stepIndex" INTEGER NOT NULL,
    "actionId" TEXT NOT NULL,
    "parentsJson" JSONB NOT NULL DEFAULT '[]',
    "inputsJson" JSONB NOT NULL DEFAULT '{}',
    "expectedOutputsJson" JSONB NOT NULL DEFAULT '{}',
    "toolId" TEXT,
    "status" "AuraPlanStepStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuraPlanStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuraPlanSimulation" (
    "id" TEXT NOT NULL,
    "planSnapshot" JSONB NOT NULL DEFAULT '{}',
    "wallClockMs" INTEGER NOT NULL DEFAULT 0,
    "externalWrites" INTEGER NOT NULL DEFAULT 0,
    "warnings" JSONB NOT NULL DEFAULT '[]',
    "outcome" TEXT NOT NULL DEFAULT 'ok',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuraPlanSimulation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuraApprovalRequest" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "kind" "AuraApprovalKind" NOT NULL,
    "requiredApprovers" INTEGER NOT NULL DEFAULT 1,
    "inputHash" TEXT NOT NULL,
    "status" "AuraApprovalStatus" NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3),
    "invalidatedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuraApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuraApprovalDecision" (
    "id" TEXT NOT NULL,
    "approvalRequestId" TEXT NOT NULL,
    "decidedByUserId" TEXT NOT NULL,
    "decision" "AuraApprovalStatus" NOT NULL,
    "rationale" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuraApprovalDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuraExecution" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "manifestId" TEXT NOT NULL,
    "authorityEnvelopeId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "organisationId" TEXT,
    "state" "AuraExecutionState" NOT NULL DEFAULT 'queued',
    "pinnedPromptBundleId" TEXT,
    "pinnedModelProfileId" TEXT,
    "pinnedPolicyVersion" TEXT NOT NULL,
    "pinnedToolVersionsJson" JSONB NOT NULL DEFAULT '{}',
    "inputHash" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuraExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuraStepExecution" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "planStepId" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "state" "AuraStepExecutionState" NOT NULL DEFAULT 'pending',
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "idempotencyKey" TEXT NOT NULL,
    "toolCallJson" JSONB,
    "toolResultJson" JSONB,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuraStepExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuraToolDefinition" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "kind" "AuraToolKind" NOT NULL,
    "status" "AuraToolStatus" NOT NULL DEFAULT 'draft',
    "versionKey" TEXT NOT NULL DEFAULT '0.0.1',
    "inputSchema" JSONB NOT NULL DEFAULT '{}',
    "outputSchema" JSONB NOT NULL DEFAULT '{}',
    "riskTier" "AuraActionRiskTier" NOT NULL DEFAULT 'low_readonly',
    "requiresConsent" BOOLEAN NOT NULL DEFAULT true,
    "writeCapable" BOOLEAN NOT NULL DEFAULT false,
    "externalEndpoint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuraToolDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuraMemoryItem" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "scope" "AuraMemoryScope" NOT NULL,
    "memoryClass" "AuraMemoryClass" NOT NULL,
    "key" TEXT NOT NULL,
    "valueJson" JSONB NOT NULL DEFAULT '{}',
    "participantConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "autoSaved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "AuraMemoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuraAgentHandoff" (
    "id" TEXT NOT NULL,
    "fromAgentId" TEXT,
    "toAgentId" TEXT,
    "toHumanUserId" TEXT,
    "kind" "AuraHandoffKind" NOT NULL,
    "contextJson" JSONB NOT NULL DEFAULT '{}',
    "reason" TEXT NOT NULL,
    "acknowledgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuraAgentHandoff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuraCompensationRecord" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "compensatedStepJson" JSONB NOT NULL DEFAULT '{}',
    "successful" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuraCompensationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuraOutcomeObservation" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "observedByUserId" TEXT,
    "signal" "AuraOutcomeSignal" NOT NULL,
    "narrative" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuraOutcomeObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuraSafetyHold" (
    "id" TEXT NOT NULL,
    "reason" "AuraSafetyHoldReason" NOT NULL,
    "status" "AuraSafetyHoldStatus" NOT NULL DEFAULT 'active',
    "affectsAgentId" TEXT,
    "affectsParticipantId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "releasedByUserId" TEXT,
    "narrative" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),

    CONSTRAINT "AuraSafetyHold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuraMcpServerRegistration" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "versionPin" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "approvedByUserId" TEXT,
    "conformancePassed" BOOLEAN NOT NULL DEFAULT false,
    "toolId" TEXT,
    "productionActivated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuraMcpServerRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuraA2AParticipation" (
    "id" TEXT NOT NULL,
    "peerLabel" TEXT NOT NULL,
    "entitlementKey" TEXT NOT NULL,
    "conformancePassed" BOOLEAN NOT NULL DEFAULT false,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuraA2AParticipation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiModelProfile" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "provider" "AiModelProvider" NOT NULL DEFAULT 'disabled',
    "modelName" TEXT NOT NULL,
    "versionKey" TEXT NOT NULL,
    "contextWindow" INTEGER NOT NULL DEFAULT 0,
    "supportsTools" BOOLEAN NOT NULL DEFAULT false,
    "productionActivated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiModelProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiPromptBundle" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "versionKey" TEXT NOT NULL,
    "role" "AiPromptRole" NOT NULL DEFAULT 'system',
    "bodyMarkdown" TEXT NOT NULL,
    "bodyHash" TEXT NOT NULL,
    "productionActivated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiPromptBundle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiSystemInventoryEntry" (
    "id" TEXT NOT NULL,
    "systemKey" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "purposeSummary" TEXT NOT NULL,
    "riskTier" "AuraActionRiskTier" NOT NULL DEFAULT 'low_readonly',
    "status" "AiSystemInventoryStatus" NOT NULL DEFAULT 'proposed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiSystemInventoryEntry_pkey" PRIMARY KEY ("id")
);


-- CreateIndex
CREATE UNIQUE INDEX "AuraAgentDefinition_slug_key" ON "AuraAgentDefinition"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "AuraAgentDefinition_currentManifestId_key" ON "AuraAgentDefinition"("currentManifestId");

-- CreateIndex
CREATE INDEX "AuraAgentDefinition_status_classification_idx" ON "AuraAgentDefinition"("status", "classification");

-- CreateIndex
CREATE INDEX "AuraAgentManifest_agentId_productionActivated_idx" ON "AuraAgentManifest"("agentId", "productionActivated");

-- CreateIndex
CREATE UNIQUE INDEX "AuraAgentManifest_agentId_versionKey_key" ON "AuraAgentManifest"("agentId", "versionKey");

-- CreateIndex
CREATE INDEX "AuraAuthorityEnvelope_subjectUserId_status_idx" ON "AuraAuthorityEnvelope"("subjectUserId", "status");

-- CreateIndex
CREATE INDEX "AuraAuthorityEnvelope_agentId_idx" ON "AuraAuthorityEnvelope"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "AuraActionDefinition_slug_key" ON "AuraActionDefinition"("slug");

-- CreateIndex
CREATE INDEX "AuraActionDefinition_riskTier_idx" ON "AuraActionDefinition"("riskTier");

-- CreateIndex
CREATE INDEX "AuraGoal_participantId_status_idx" ON "AuraGoal"("participantId", "status");

-- CreateIndex
CREATE INDEX "AuraGoal_source_idx" ON "AuraGoal"("source");

-- CreateIndex
CREATE UNIQUE INDEX "AuraPlan_simulationRunId_key" ON "AuraPlan"("simulationRunId");

-- CreateIndex
CREATE INDEX "AuraPlan_goalId_status_idx" ON "AuraPlan"("goalId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AuraPlanStep_planId_stepIndex_key" ON "AuraPlanStep"("planId", "stepIndex");

-- CreateIndex
CREATE INDEX "AuraApprovalRequest_planId_status_idx" ON "AuraApprovalRequest"("planId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AuraApprovalDecision_approvalRequestId_decidedByUserId_key" ON "AuraApprovalDecision"("approvalRequestId", "decidedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "AuraExecution_idempotencyKey_key" ON "AuraExecution"("idempotencyKey");

-- CreateIndex
CREATE INDEX "AuraExecution_participantId_state_idx" ON "AuraExecution"("participantId", "state");

-- CreateIndex
CREATE INDEX "AuraExecution_agentId_state_idx" ON "AuraExecution"("agentId", "state");

-- CreateIndex
CREATE INDEX "AuraStepExecution_state_idx" ON "AuraStepExecution"("state");

-- CreateIndex
CREATE UNIQUE INDEX "AuraStepExecution_executionId_planStepId_attempt_key" ON "AuraStepExecution"("executionId", "planStepId", "attempt");

-- CreateIndex
CREATE UNIQUE INDEX "AuraStepExecution_idempotencyKey_key" ON "AuraStepExecution"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "AuraToolDefinition_slug_key" ON "AuraToolDefinition"("slug");

-- CreateIndex
CREATE INDEX "AuraToolDefinition_kind_status_idx" ON "AuraToolDefinition"("kind", "status");

-- CreateIndex
CREATE INDEX "AuraMemoryItem_participantId_memoryClass_idx" ON "AuraMemoryItem"("participantId", "memoryClass");

-- CreateIndex
CREATE UNIQUE INDEX "AuraMemoryItem_participantId_scope_key_key" ON "AuraMemoryItem"("participantId", "scope", "key");

-- CreateIndex
CREATE INDEX "AuraAgentHandoff_fromAgentId_idx" ON "AuraAgentHandoff"("fromAgentId");

-- CreateIndex
CREATE INDEX "AuraAgentHandoff_toAgentId_idx" ON "AuraAgentHandoff"("toAgentId");

-- CreateIndex
CREATE INDEX "AuraCompensationRecord_executionId_idx" ON "AuraCompensationRecord"("executionId");

-- CreateIndex
CREATE INDEX "AuraOutcomeObservation_executionId_signal_idx" ON "AuraOutcomeObservation"("executionId", "signal");

-- CreateIndex
CREATE INDEX "AuraSafetyHold_status_idx" ON "AuraSafetyHold"("status");

-- CreateIndex
CREATE INDEX "AuraSafetyHold_affectsAgentId_idx" ON "AuraSafetyHold"("affectsAgentId");

-- CreateIndex
CREATE INDEX "AuraSafetyHold_affectsParticipantId_idx" ON "AuraSafetyHold"("affectsParticipantId");

-- CreateIndex
CREATE UNIQUE INDEX "AuraMcpServerRegistration_slug_key" ON "AuraMcpServerRegistration"("slug");

-- CreateIndex
CREATE INDEX "AuraMcpServerRegistration_productionActivated_idx" ON "AuraMcpServerRegistration"("productionActivated");

-- CreateIndex
CREATE UNIQUE INDEX "AiModelProfile_slug_key" ON "AiModelProfile"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "AiModelProfile_slug_versionKey_key" ON "AiModelProfile"("slug", "versionKey");

-- CreateIndex
CREATE UNIQUE INDEX "AiPromptBundle_slug_key" ON "AiPromptBundle"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "AiPromptBundle_slug_versionKey_key" ON "AiPromptBundle"("slug", "versionKey");

-- CreateIndex
CREATE UNIQUE INDEX "AiSystemInventoryEntry_systemKey_key" ON "AiSystemInventoryEntry"("systemKey");

-- AddForeignKey
ALTER TABLE "AuraAgentDefinition" ADD CONSTRAINT "AuraAgentDefinition_ownerOrganisationId_fkey" FOREIGN KEY ("ownerOrganisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "AuraAgentDefinition" ADD CONSTRAINT "AuraAgentDefinition_currentManifestId_fkey" FOREIGN KEY ("currentManifestId") REFERENCES "AuraAgentManifest"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "AuraAgentManifest" ADD CONSTRAINT "AuraAgentManifest_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AuraAgentDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "AuraAgentManifest" ADD CONSTRAINT "AuraAgentManifest_promptBundleId_fkey" FOREIGN KEY ("promptBundleId") REFERENCES "AiPromptBundle"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "AuraAgentManifest" ADD CONSTRAINT "AuraAgentManifest_modelProfileId_fkey" FOREIGN KEY ("modelProfileId") REFERENCES "AiModelProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "AuraAuthorityEnvelope" ADD CONSTRAINT "AuraAuthorityEnvelope_subjectUserId_fkey" FOREIGN KEY ("subjectUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "AuraAuthorityEnvelope" ADD CONSTRAINT "AuraAuthorityEnvelope_grantedByUserId_fkey" FOREIGN KEY ("grantedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "AuraAuthorityEnvelope" ADD CONSTRAINT "AuraAuthorityEnvelope_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AuraAgentDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "AuraAuthorityEnvelope" ADD CONSTRAINT "AuraAuthorityEnvelope_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "AuraGoal" ADD CONSTRAINT "AuraGoal_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "AuraGoal" ADD CONSTRAINT "AuraGoal_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "AuraGoal" ADD CONSTRAINT "AuraGoal_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AuraAgentDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "AuraGoal" ADD CONSTRAINT "AuraGoal_authorityEnvelopeId_fkey" FOREIGN KEY ("authorityEnvelopeId") REFERENCES "AuraAuthorityEnvelope"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "AuraGoal" ADD CONSTRAINT "AuraGoal_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "AuraPlan" ADD CONSTRAINT "AuraPlan_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "AuraGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "AuraPlan" ADD CONSTRAINT "AuraPlan_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AuraAgentDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "AuraPlan" ADD CONSTRAINT "AuraPlan_simulationRunId_fkey" FOREIGN KEY ("simulationRunId") REFERENCES "AuraPlanSimulation"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "AuraPlanStep" ADD CONSTRAINT "AuraPlanStep_planId_fkey" FOREIGN KEY ("planId") REFERENCES "AuraPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "AuraPlanStep" ADD CONSTRAINT "AuraPlanStep_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "AuraActionDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "AuraPlanStep" ADD CONSTRAINT "AuraPlanStep_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "AuraToolDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "AuraApprovalRequest" ADD CONSTRAINT "AuraApprovalRequest_planId_fkey" FOREIGN KEY ("planId") REFERENCES "AuraPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "AuraApprovalDecision" ADD CONSTRAINT "AuraApprovalDecision_approvalRequestId_fkey" FOREIGN KEY ("approvalRequestId") REFERENCES "AuraApprovalRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "AuraApprovalDecision" ADD CONSTRAINT "AuraApprovalDecision_decidedByUserId_fkey" FOREIGN KEY ("decidedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "AuraExecution" ADD CONSTRAINT "AuraExecution_planId_fkey" FOREIGN KEY ("planId") REFERENCES "AuraPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "AuraExecution" ADD CONSTRAINT "AuraExecution_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AuraAgentDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "AuraExecution" ADD CONSTRAINT "AuraExecution_manifestId_fkey" FOREIGN KEY ("manifestId") REFERENCES "AuraAgentManifest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "AuraExecution" ADD CONSTRAINT "AuraExecution_authorityEnvelopeId_fkey" FOREIGN KEY ("authorityEnvelopeId") REFERENCES "AuraAuthorityEnvelope"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "AuraExecution" ADD CONSTRAINT "AuraExecution_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "AuraExecution" ADD CONSTRAINT "AuraExecution_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "AuraStepExecution" ADD CONSTRAINT "AuraStepExecution_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "AuraExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "AuraStepExecution" ADD CONSTRAINT "AuraStepExecution_planStepId_fkey" FOREIGN KEY ("planStepId") REFERENCES "AuraPlanStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "AuraStepExecution" ADD CONSTRAINT "AuraStepExecution_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "AuraActionDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "AuraMemoryItem" ADD CONSTRAINT "AuraMemoryItem_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "AuraAgentHandoff" ADD CONSTRAINT "AuraAgentHandoff_fromAgentId_fkey" FOREIGN KEY ("fromAgentId") REFERENCES "AuraAgentDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "AuraAgentHandoff" ADD CONSTRAINT "AuraAgentHandoff_toAgentId_fkey" FOREIGN KEY ("toAgentId") REFERENCES "AuraAgentDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "AuraAgentHandoff" ADD CONSTRAINT "AuraAgentHandoff_toHumanUserId_fkey" FOREIGN KEY ("toHumanUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "AuraCompensationRecord" ADD CONSTRAINT "AuraCompensationRecord_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "AuraExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "AuraOutcomeObservation" ADD CONSTRAINT "AuraOutcomeObservation_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "AuraExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "AuraOutcomeObservation" ADD CONSTRAINT "AuraOutcomeObservation_observedByUserId_fkey" FOREIGN KEY ("observedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "AuraSafetyHold" ADD CONSTRAINT "AuraSafetyHold_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "AuraSafetyHold" ADD CONSTRAINT "AuraSafetyHold_releasedByUserId_fkey" FOREIGN KEY ("releasedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "AuraMcpServerRegistration" ADD CONSTRAINT "AuraMcpServerRegistration_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- AddForeignKey
ALTER TABLE "AuraMcpServerRegistration" ADD CONSTRAINT "AuraMcpServerRegistration_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "AuraToolDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;


