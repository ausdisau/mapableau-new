-- NDIS Wave 7: controlled pilot operations and runtime safety
-- Empty allowlists = deny. limitedLiveEnabled defaults false.
-- Does not authorise via NdiaPilotApprovalRecord.

CREATE TYPE "PilotStatus" AS ENUM (
  'draft', 'pending_decision', 'approved', 'active', 'paused', 'draining', 'terminated', 'closed'
);

CREATE TYPE "PilotStage" AS ENUM (
  'design', 'readiness', 'sandbox', 'dry_run', 'shadow', 'limited_live', 'controlled_live', 'wind_down', 'closed'
);

CREATE TYPE "PilotDecision" AS ENUM (
  'approve', 'reject', 'advance_stage', 'pause', 'resume', 'terminate', 'close', 'require_evidence', 'defer'
);

CREATE TYPE "PilotPauseReason" AS ENUM (
  'safety_trigger', 'incident', 'complaint', 'limit_breach', 'operational', 'regulatory', 'change_freeze', 'manual', 'other'
);

CREATE TYPE "PilotEnrolmentStatus" AS ENUM (
  'invited', 'information_provided', 'consent_pending', 'enrolled', 'suspended', 'exited', 'withdrawn', 'declined'
);

CREATE TYPE "PilotReviewOutcome" AS ENUM (
  'continue', 'continue_with_actions', 'pause_recommended', 'terminate_recommended', 'escalate', 'insufficient_evidence'
);

CREATE TYPE "PilotSignalType" AS ENUM (
  'incident', 'complaint', 'limit_breach', 'accessibility', 'payment_exception', 'worker_eligibility',
  'consent_withdrawal', 'operational_health', 'trend_anomaly', 'other'
);

CREATE TYPE "PilotOperatorRole" AS ENUM (
  'commander', 'deputy', 'finance', 'safety', 'support', 'observer'
);

CREATE TYPE "PilotReservationStatus" AS ENUM (
  'reserved', 'committed', 'released', 'expired'
);

CREATE TYPE "PilotReservationType" AS ENUM (
  'transaction', 'daily_exposure', 'participant_exposure', 'total_exposure'
);

CREATE TYPE "PilotCorrectiveActionType" AS ENUM (
  'process', 'training', 'configuration', 'communication', 'technical', 'other'
);

CREATE TYPE "PilotCorrectiveActionStatus" AS ENUM (
  'open', 'in_progress', 'completed', 'verified', 'cancelled'
);

CREATE TYPE "PilotChangeStatus" AS ENUM (
  'draft', 'submitted', 'approved', 'rejected', 'scheduled', 'applied', 'rolled_back', 'cancelled'
);

CREATE TYPE "PilotTriggerStatus" AS ENUM (
  'armed', 'fired', 'acknowledged', 'resolved', 'disarmed'
);

CREATE TYPE "PilotReportabilityState" AS ENUM (
  'not_assessed', 'under_review', 'not_reportable', 'potentially_reportable', 'reportable', 'reported', 'closed'
);

CREATE TABLE "ControlledPilot" (
  "id" TEXT NOT NULL,
  "organisationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "status" "PilotStatus" NOT NULL DEFAULT 'draft',
  "stage" "PilotStage" NOT NULL DEFAULT 'design',
  "summary" TEXT,
  "supportItemAllowlist" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "fundingRouteAllowlist" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "integrationProfileIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "maxTransactionCents" INTEGER NOT NULL DEFAULT 0,
  "maxDailyExposureCents" INTEGER NOT NULL DEFAULT 0,
  "maxParticipantExposureCents" INTEGER NOT NULL DEFAULT 0,
  "maxTotalExposureCents" INTEGER NOT NULL DEFAULT 0,
  "maxActiveParticipants" INTEGER NOT NULL DEFAULT 0,
  "limitedLiveEnabled" BOOLEAN NOT NULL DEFAULT false,
  "assuranceAssessmentId" TEXT,
  "goLiveAssessmentId" TEXT,
  "pauseReason" "PilotPauseReason",
  "pausedAt" TIMESTAMP(3),
  "pausedById" TEXT,
  "resumeRequiresDecision" BOOLEAN NOT NULL DEFAULT true,
  "plannedStartAt" TIMESTAMP(3),
  "plannedEndAt" TIMESTAMP(3),
  "activatedAt" TIMESTAMP(3),
  "terminatedAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "createdById" TEXT NOT NULL,
  "updatedById" TEXT,
  "correlationId" TEXT,
  "safeMetadataJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ControlledPilot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PilotDecisionRecord" (
  "id" TEXT NOT NULL,
  "pilotId" TEXT NOT NULL,
  "decision" "PilotDecision" NOT NULL,
  "fromStatus" "PilotStatus",
  "toStatus" "PilotStatus",
  "fromStage" "PilotStage",
  "toStage" "PilotStage",
  "rationale" TEXT NOT NULL,
  "evidenceRefsJson" JSONB NOT NULL DEFAULT '[]',
  "decidedById" TEXT NOT NULL,
  "correlationId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PilotDecisionRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PilotParticipantEnrolment" (
  "id" TEXT NOT NULL,
  "pilotId" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "status" "PilotEnrolmentStatus" NOT NULL DEFAULT 'invited',
  "informationProvidedAt" TIMESTAMP(3),
  "pilotConsentAt" TIMESTAMP(3),
  "pilotConsentVersion" TEXT,
  "pilotConsentById" TEXT,
  "withdrawnAt" TIMESTAMP(3),
  "exitReason" TEXT,
  "exitedAt" TIMESTAMP(3),
  "invitedById" TEXT,
  "delegateUserId" TEXT,
  "safeNotesJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PilotParticipantEnrolment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PilotWorkerAuthorisation" (
  "id" TEXT NOT NULL,
  "pilotId" TEXT NOT NULL,
  "workerUserId" TEXT NOT NULL,
  "authorisedById" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "credentialChecksJson" JSONB NOT NULL DEFAULT '[]',
  "revokedAt" TIMESTAMP(3),
  "revokedById" TEXT,
  "revokeReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PilotWorkerAuthorisation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PilotLimitReservation" (
  "id" TEXT NOT NULL,
  "pilotId" TEXT NOT NULL,
  "participantId" TEXT,
  "reservationType" "PilotReservationType" NOT NULL,
  "status" "PilotReservationStatus" NOT NULL DEFAULT 'reserved',
  "amountCents" INTEGER NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "correlationId" TEXT,
  "reservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "committedAt" TIMESTAMP(3),
  "releasedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "safeMetadataJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PilotLimitReservation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PilotExposureLedger" (
  "id" TEXT NOT NULL,
  "pilotId" TEXT NOT NULL,
  "participantId" TEXT,
  "entryType" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL,
  "balanceAfterCents" INTEGER NOT NULL,
  "reservationId" TEXT,
  "correlationId" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "safeMetadataJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PilotExposureLedger_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PilotAuthorisedOperator" (
  "id" TEXT NOT NULL,
  "pilotId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "PilotOperatorRole" NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "authorisedById" TEXT,
  "authorisedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PilotAuthorisedOperator_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PilotOperatorShift" (
  "id" TEXT NOT NULL,
  "pilotId" TEXT NOT NULL,
  "operatorId" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PilotOperatorShift_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PilotHandoverRecord" (
  "id" TEXT NOT NULL,
  "pilotId" TEXT NOT NULL,
  "fromShiftId" TEXT,
  "toShiftId" TEXT,
  "summary" TEXT NOT NULL,
  "openActionsJson" JSONB NOT NULL DEFAULT '[]',
  "acknowledgedAt" TIMESTAMP(3),
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PilotHandoverRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PilotSafetyTrigger" (
  "id" TEXT NOT NULL,
  "pilotId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" "PilotTriggerStatus" NOT NULL DEFAULT 'armed',
  "conditionJson" JSONB NOT NULL DEFAULT '{}',
  "firedAt" TIMESTAMP(3),
  "acknowledgedAt" TIMESTAMP(3),
  "acknowledgedById" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PilotSafetyTrigger_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PilotSafetySignal" (
  "id" TEXT NOT NULL,
  "pilotId" TEXT NOT NULL,
  "triggerId" TEXT,
  "signalType" "PilotSignalType" NOT NULL,
  "severity" TEXT NOT NULL DEFAULT 'medium',
  "summary" TEXT NOT NULL,
  "sourceRef" TEXT,
  "acknowledged" BOOLEAN NOT NULL DEFAULT false,
  "acknowledgedById" TEXT,
  "acknowledgedAt" TIMESTAMP(3),
  "safePayloadJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PilotSafetySignal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PilotCorrectiveAction" (
  "id" TEXT NOT NULL,
  "pilotId" TEXT NOT NULL,
  "actionType" "PilotCorrectiveActionType" NOT NULL,
  "status" "PilotCorrectiveActionStatus" NOT NULL DEFAULT 'open',
  "title" TEXT NOT NULL,
  "description" TEXT,
  "ownerUserId" TEXT,
  "dueAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "verifiedAt" TIMESTAMP(3),
  "signalId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PilotCorrectiveAction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PilotDailyReview" (
  "id" TEXT NOT NULL,
  "pilotId" TEXT NOT NULL,
  "reviewDate" TIMESTAMP(3) NOT NULL,
  "outcome" "PilotReviewOutcome" NOT NULL,
  "checklistJson" JSONB NOT NULL DEFAULT '{}',
  "findingsJson" JSONB NOT NULL DEFAULT '[]',
  "reviewedById" TEXT NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PilotDailyReview_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PilotChangeRequest" (
  "id" TEXT NOT NULL,
  "pilotId" TEXT NOT NULL,
  "status" "PilotChangeStatus" NOT NULL DEFAULT 'draft',
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "changeType" TEXT NOT NULL,
  "riskSummary" TEXT,
  "rollbackPlan" TEXT,
  "requestedById" TEXT NOT NULL,
  "approvedById" TEXT,
  "approvedAt" TIMESTAMP(3),
  "appliedAt" TIMESTAMP(3),
  "rolledBackAt" TIMESTAMP(3),
  "safeDiffJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PilotChangeRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PilotExerciseRecord" (
  "id" TEXT NOT NULL,
  "pilotId" TEXT NOT NULL,
  "exerciseType" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "outcome" TEXT,
  "conductedById" TEXT,
  "conductedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "evidenceJson" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PilotExerciseRecord_pkey" PRIMARY KEY ("id")
);

-- Link existing incident/complaint systems (no second systems)
ALTER TABLE "IncidentReport" ADD COLUMN "pilotId" TEXT;
ALTER TABLE "IncidentReport" ADD COLUMN "reportabilityState" "PilotReportabilityState";
ALTER TABLE "complaints" ADD COLUMN "pilotId" TEXT;
ALTER TABLE "complaints" ADD COLUMN "anonymous" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "ControlledPilot_organisationId_code_key" ON "ControlledPilot"("organisationId", "code");
CREATE INDEX "ControlledPilot_organisationId_status_idx" ON "ControlledPilot"("organisationId", "status");
CREATE INDEX "ControlledPilot_stage_status_idx" ON "ControlledPilot"("stage", "status");
CREATE INDEX "ControlledPilot_assuranceAssessmentId_idx" ON "ControlledPilot"("assuranceAssessmentId");
CREATE INDEX "ControlledPilot_goLiveAssessmentId_idx" ON "ControlledPilot"("goLiveAssessmentId");

CREATE INDEX "PilotDecisionRecord_pilotId_createdAt_idx" ON "PilotDecisionRecord"("pilotId", "createdAt");
CREATE INDEX "PilotDecisionRecord_decidedById_idx" ON "PilotDecisionRecord"("decidedById");

CREATE UNIQUE INDEX "PilotParticipantEnrolment_pilotId_participantId_key" ON "PilotParticipantEnrolment"("pilotId", "participantId");
CREATE INDEX "PilotParticipantEnrolment_participantId_status_idx" ON "PilotParticipantEnrolment"("participantId", "status");
CREATE INDEX "PilotParticipantEnrolment_pilotId_status_idx" ON "PilotParticipantEnrolment"("pilotId", "status");

CREATE UNIQUE INDEX "PilotWorkerAuthorisation_pilotId_workerUserId_key" ON "PilotWorkerAuthorisation"("pilotId", "workerUserId");
CREATE INDEX "PilotWorkerAuthorisation_pilotId_active_idx" ON "PilotWorkerAuthorisation"("pilotId", "active");
CREATE INDEX "PilotWorkerAuthorisation_workerUserId_idx" ON "PilotWorkerAuthorisation"("workerUserId");

CREATE UNIQUE INDEX "PilotLimitReservation_pilotId_idempotencyKey_key" ON "PilotLimitReservation"("pilotId", "idempotencyKey");
CREATE INDEX "PilotLimitReservation_pilotId_status_idx" ON "PilotLimitReservation"("pilotId", "status");
CREATE INDEX "PilotLimitReservation_participantId_status_idx" ON "PilotLimitReservation"("participantId", "status");

CREATE INDEX "PilotExposureLedger_pilotId_occurredAt_idx" ON "PilotExposureLedger"("pilotId", "occurredAt");
CREATE INDEX "PilotExposureLedger_participantId_occurredAt_idx" ON "PilotExposureLedger"("participantId", "occurredAt");
CREATE INDEX "PilotExposureLedger_reservationId_idx" ON "PilotExposureLedger"("reservationId");

CREATE UNIQUE INDEX "PilotAuthorisedOperator_pilotId_userId_role_key" ON "PilotAuthorisedOperator"("pilotId", "userId", "role");
CREATE INDEX "PilotAuthorisedOperator_pilotId_active_idx" ON "PilotAuthorisedOperator"("pilotId", "active");

CREATE INDEX "PilotOperatorShift_pilotId_startedAt_idx" ON "PilotOperatorShift"("pilotId", "startedAt");
CREATE INDEX "PilotOperatorShift_operatorId_idx" ON "PilotOperatorShift"("operatorId");

CREATE INDEX "PilotHandoverRecord_pilotId_createdAt_idx" ON "PilotHandoverRecord"("pilotId", "createdAt");

CREATE INDEX "PilotSafetyTrigger_pilotId_status_idx" ON "PilotSafetyTrigger"("pilotId", "status");

CREATE INDEX "PilotSafetySignal_pilotId_signalType_createdAt_idx" ON "PilotSafetySignal"("pilotId", "signalType", "createdAt");
CREATE INDEX "PilotSafetySignal_triggerId_idx" ON "PilotSafetySignal"("triggerId");

CREATE INDEX "PilotCorrectiveAction_pilotId_status_idx" ON "PilotCorrectiveAction"("pilotId", "status");
CREATE INDEX "PilotCorrectiveAction_ownerUserId_idx" ON "PilotCorrectiveAction"("ownerUserId");

CREATE UNIQUE INDEX "PilotDailyReview_pilotId_reviewDate_key" ON "PilotDailyReview"("pilotId", "reviewDate");
CREATE INDEX "PilotDailyReview_pilotId_createdAt_idx" ON "PilotDailyReview"("pilotId", "createdAt");

CREATE INDEX "PilotChangeRequest_pilotId_status_idx" ON "PilotChangeRequest"("pilotId", "status");

CREATE INDEX "PilotExerciseRecord_pilotId_conductedAt_idx" ON "PilotExerciseRecord"("pilotId", "conductedAt");

CREATE INDEX "IncidentReport_pilotId_idx" ON "IncidentReport"("pilotId");
CREATE INDEX "complaints_pilotId_idx" ON "complaints"("pilotId");

ALTER TABLE "ControlledPilot" ADD CONSTRAINT "ControlledPilot_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ControlledPilot" ADD CONSTRAINT "ControlledPilot_pausedById_fkey" FOREIGN KEY ("pausedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ControlledPilot" ADD CONSTRAINT "ControlledPilot_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ControlledPilot" ADD CONSTRAINT "ControlledPilot_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PilotDecisionRecord" ADD CONSTRAINT "PilotDecisionRecord_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "ControlledPilot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PilotDecisionRecord" ADD CONSTRAINT "PilotDecisionRecord_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PilotParticipantEnrolment" ADD CONSTRAINT "PilotParticipantEnrolment_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "ControlledPilot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PilotParticipantEnrolment" ADD CONSTRAINT "PilotParticipantEnrolment_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PilotParticipantEnrolment" ADD CONSTRAINT "PilotParticipantEnrolment_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PilotParticipantEnrolment" ADD CONSTRAINT "PilotParticipantEnrolment_delegateUserId_fkey" FOREIGN KEY ("delegateUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PilotWorkerAuthorisation" ADD CONSTRAINT "PilotWorkerAuthorisation_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "ControlledPilot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PilotWorkerAuthorisation" ADD CONSTRAINT "PilotWorkerAuthorisation_workerUserId_fkey" FOREIGN KEY ("workerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PilotWorkerAuthorisation" ADD CONSTRAINT "PilotWorkerAuthorisation_authorisedById_fkey" FOREIGN KEY ("authorisedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PilotLimitReservation" ADD CONSTRAINT "PilotLimitReservation_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "ControlledPilot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PilotExposureLedger" ADD CONSTRAINT "PilotExposureLedger_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "ControlledPilot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PilotAuthorisedOperator" ADD CONSTRAINT "PilotAuthorisedOperator_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "ControlledPilot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PilotAuthorisedOperator" ADD CONSTRAINT "PilotAuthorisedOperator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PilotOperatorShift" ADD CONSTRAINT "PilotOperatorShift_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "ControlledPilot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PilotOperatorShift" ADD CONSTRAINT "PilotOperatorShift_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "PilotAuthorisedOperator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PilotHandoverRecord" ADD CONSTRAINT "PilotHandoverRecord_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "ControlledPilot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PilotHandoverRecord" ADD CONSTRAINT "PilotHandoverRecord_fromShiftId_fkey" FOREIGN KEY ("fromShiftId") REFERENCES "PilotOperatorShift"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PilotHandoverRecord" ADD CONSTRAINT "PilotHandoverRecord_toShiftId_fkey" FOREIGN KEY ("toShiftId") REFERENCES "PilotOperatorShift"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PilotHandoverRecord" ADD CONSTRAINT "PilotHandoverRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PilotSafetyTrigger" ADD CONSTRAINT "PilotSafetyTrigger_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "ControlledPilot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PilotSafetySignal" ADD CONSTRAINT "PilotSafetySignal_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "ControlledPilot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PilotSafetySignal" ADD CONSTRAINT "PilotSafetySignal_triggerId_fkey" FOREIGN KEY ("triggerId") REFERENCES "PilotSafetyTrigger"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PilotCorrectiveAction" ADD CONSTRAINT "PilotCorrectiveAction_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "ControlledPilot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PilotCorrectiveAction" ADD CONSTRAINT "PilotCorrectiveAction_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PilotDailyReview" ADD CONSTRAINT "PilotDailyReview_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "ControlledPilot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PilotDailyReview" ADD CONSTRAINT "PilotDailyReview_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PilotChangeRequest" ADD CONSTRAINT "PilotChangeRequest_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "ControlledPilot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PilotChangeRequest" ADD CONSTRAINT "PilotChangeRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PilotChangeRequest" ADD CONSTRAINT "PilotChangeRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PilotExerciseRecord" ADD CONSTRAINT "PilotExerciseRecord_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "ControlledPilot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "IncidentReport" ADD CONSTRAINT "IncidentReport_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "ControlledPilot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "ControlledPilot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
