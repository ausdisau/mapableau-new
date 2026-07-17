-- MapAble AURA Wave 4 — execution approvals, executions, receipts (additive)

CREATE TABLE "aura_execution_approvals" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "proposalVersion" INTEGER NOT NULL,
    "proposalHash" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "recipientSnapshotJson" JSONB NOT NULL,
    "purposeCode" TEXT NOT NULL,
    "disclosureSnapshotJson" JSONB NOT NULL,
    "expectedResult" TEXT NOT NULL,
    "possibleFailuresJson" JSONB NOT NULL DEFAULT '[]',
    "fallbackPlanJson" JSONB NOT NULL DEFAULT '[]',
    "consentSnapshotIdsJson" JSONB NOT NULL DEFAULT '[]',
    "policyVersion" TEXT NOT NULL,
    "servicePreflightVersion" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "authenticationContextJson" JSONB NOT NULL,
    "usedAt" TIMESTAMP(3),
    "usedByExecutionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "aura_execution_approvals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "aura_action_executions" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "proposalVersion" INTEGER NOT NULL,
    "proposalHash" TEXT NOT NULL,
    "executionApprovalId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "serviceVersion" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "authorisedAt" TIMESTAMP(3),
    "queuedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "serviceReceiptReceivedAt" TIMESTAMP(3),
    "verificationStartedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "applicationReceiptId" TEXT,
    "outboxEventIdsJson" JSONB NOT NULL DEFAULT '[]',
    "recordsCreatedJson" JSONB NOT NULL DEFAULT '[]',
    "deliveryStateJson" JSONB,
    "postconditionsJson" JSONB NOT NULL DEFAULT '[]',
    "realWorldOutcome" TEXT NOT NULL DEFAULT 'not_observed',
    "failureCode" TEXT,
    "failureMessage" TEXT,
    "cancellationSupported" BOOLEAN NOT NULL DEFAULT false,
    "compensationSupported" BOOLEAN NOT NULL DEFAULT false,
    "auditCorrelationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "aura_action_executions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "aura_action_executions_idempotencyKey_key" ON "aura_action_executions"("idempotencyKey");
CREATE INDEX "aura_action_executions_missionId_state_idx" ON "aura_action_executions"("missionId", "state");
CREATE INDEX "aura_action_executions_proposalId_proposalVersion_idx" ON "aura_action_executions"("proposalId", "proposalVersion");

CREATE TABLE "aura_execution_receipts" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "proposalVersion" INTEGER NOT NULL,
    "proposalHash" TEXT NOT NULL,
    "executionApprovalId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "finalState" TEXT NOT NULL,
    "serviceReceiptJson" JSONB NOT NULL,
    "recordsCreatedJson" JSONB NOT NULL DEFAULT '[]',
    "deliveriesJson" JSONB NOT NULL DEFAULT '[]',
    "postconditionSummaryJson" JSONB NOT NULL DEFAULT '[]',
    "realWorldOutcomeConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "participantFacingSummary" TEXT NOT NULL,
    "limitationsJson" JSONB NOT NULL DEFAULT '[]',
    "fallbackActionsJson" JSONB NOT NULL DEFAULT '[]',
    "auditCorrelationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "aura_execution_receipts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "aura_execution_receipts_executionId_key" ON "aura_execution_receipts"("executionId");
CREATE INDEX "aura_execution_receipts_missionId_createdAt_idx" ON "aura_execution_receipts"("missionId", "createdAt");
CREATE INDEX "aura_execution_receipts_proposalId_idx" ON "aura_execution_receipts"("proposalId");

CREATE INDEX "aura_execution_approvals_proposalId_proposalHash_idx" ON "aura_execution_approvals"("proposalId", "proposalHash");
CREATE INDEX "aura_execution_approvals_participantId_expiresAt_idx" ON "aura_execution_approvals"("participantId", "expiresAt");
CREATE INDEX "aura_execution_approvals_missionId_decision_idx" ON "aura_execution_approvals"("missionId", "decision");
