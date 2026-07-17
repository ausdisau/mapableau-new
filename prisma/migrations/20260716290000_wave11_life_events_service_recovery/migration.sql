-- MapAble Wave 11: Life Events & Service Recovery.
-- Forward-only. All new enums / models are additive. Wave 2–10 semantics
-- (consent-v2, disclosure gateway, wallet, delegation, AURA safety envelope,
-- tenant scoping, invoice/billing approvals) are preserved.
--
-- Continuity is a PROJECTION over existing incidents/complaints/bookings/AURA
-- executions. It does NOT create a second incident/complaint/booking/execution
-- system and MUST NOT weaken existing prohibitions:
--   * AURA cannot approve invoices, claims, or payments (Wave 10).
--   * AURA cannot call emergency services (Wave 11 emergency boundary).
--   * AURA cannot alter consent, delegation, or safeguarding closure.
--   * Life events are participant/authorised-human declared, never auto.
--   * Essential support is participant-defined, never inferred from diagnosis.
--   * Standing recovery instructions are narrow, revocable, rechecked at
--     execution and cannot authorise prohibited or regulated actions.
--   * External civic feeds are DISABLED by default and untrusted until
--     validated + fresh.
--
-- Executable service-recovery actions must run through the shared idempotency
-- + state-machine + compensation patterns established in Wave 10. Stale
-- signals cannot drive destructive action.

-- CreateEnum
CREATE TYPE "LifeEventKind" AS ENUM ('address_change', 'employment_change', 'household_change', 'hospital_admission', 'hospital_discharge', 'bereavement', 'legal_status_change', 'representative_change', 'travel_planned', 'service_pause_planned', 'provider_wind_down', 'provider_closure', 'disaster_impact', 'other');
-- CreateEnum
CREATE TYPE "LifeEventStatus" AS ENUM ('draft', 'confirmed', 'active', 'completed', 'cancelled', 'disputed');
-- CreateEnum
CREATE TYPE "LifeEventSource" AS ENUM ('participant_self', 'delegate', 'coordinator', 'provider', 'operational_signal', 'civic_feed', 'aura_suggestion');
-- CreateEnum
CREATE TYPE "ContinuitySignalKind" AS ENUM ('care_shift_cancelled', 'transport_booking_cancelled', 'worker_unavailable', 'provider_closure_notice', 'no_show_pattern', 'address_mismatch', 'funding_expiring', 'plan_reassessment_due', 'life_event_declared', 'aura_flag', 'external_civic_feed', 'reliability_incident', 'provider_failure', 'reservation_expired', 'other');
-- CreateEnum
CREATE TYPE "ContinuitySignalStatus" AS ENUM ('received', 'validated', 'stale', 'rejected', 'correlated', 'resolved');
-- CreateEnum
CREATE TYPE "ContinuitySignalConfidence" AS ENUM ('low', 'medium', 'high', 'verified');
-- CreateEnum
CREATE TYPE "ContinuityNodeKind" AS ENUM ('participant', 'worker', 'provider', 'care_request', 'care_shift', 'transport_booking', 'appointment', 'housing_arrangement', 'employment_placement', 'goal', 'funding_source', 'external_service', 'other');
-- CreateEnum
CREATE TYPE "ContinuityDependencyKind" AS ENUM ('required_for', 'supports', 'transports_to', 'employed_at', 'housed_at', 'funds', 'authorises', 'other');
-- CreateEnum
CREATE TYPE "ContinuityImpactLevel" AS ENUM ('none', 'minor', 'moderate', 'significant', 'critical');
-- CreateEnum
CREATE TYPE "ContinuityCaseStatus" AS ENUM ('open', 'triage', 'planning', 'awaiting_approval', 'in_recovery', 'monitoring', 'resolved', 'closed', 'abandoned');
-- CreateEnum
CREATE TYPE "ContinuityCasePriority" AS ENUM ('low', 'medium', 'high', 'urgent');
-- CreateEnum
CREATE TYPE "ContinuityCaseCategory" AS ENUM ('care', 'transport', 'appointment_non_clinical', 'employment', 'housing', 'provider_failure', 'finance_recovery', 'civic_disruption', 'life_event', 'other');
-- CreateEnum
CREATE TYPE "RecoveryOptionKind" AS ENUM ('reschedule', 'substitute_worker', 'substitute_provider', 'substitute_transport', 'waitlist', 'goal_preserving_alternative', 'standing_instruction_apply', 'manual_coordination', 'do_nothing', 'no_safe_option');
-- CreateEnum
CREATE TYPE "RecoveryOptionEligibility" AS ENUM ('eligible', 'ineligible', 'requires_approval', 'requires_consent', 'requires_participant_decision', 'blocked_by_policy', 'blocked_by_prohibition', 'blocked_by_emergency_boundary');
-- CreateEnum
CREATE TYPE "RecoveryPlanStatus" AS ENUM ('draft', 'simulated', 'awaiting_participant', 'awaiting_delegate', 'awaiting_coordinator', 'approved', 'executing', 'completed', 'compensated', 'failed', 'cancelled', 'execution_unknown');
-- CreateEnum
CREATE TYPE "RecoveryPlanStepKind" AS ENUM ('notify_participant', 'notify_delegate', 'notify_provider', 'request_consent', 'request_approval', 'create_substitute_booking', 'reschedule_existing', 'reserve_capacity', 'cancel_with_approval', 'update_goal_preserving_note', 'handoff_to_human', 'wait_for_signal', 'observe_outcome', 'compensating_action', 'no_op');
-- CreateEnum
CREATE TYPE "RecoveryPlanStepStatus" AS ENUM ('pending', 'running', 'succeeded', 'failed', 'execution_unknown', 'compensated', 'skipped');
-- CreateEnum
CREATE TYPE "StandingRecoveryInstructionScope" AS ENUM ('care', 'transport', 'appointment_non_clinical', 'employment', 'housing', 'finance_recovery', 'provider_failure', 'civic_disruption', 'general');
-- CreateEnum
CREATE TYPE "StandingRecoveryInstructionStatus" AS ENUM ('draft', 'active', 'suspended', 'revoked', 'expired');
-- CreateEnum
CREATE TYPE "ContinuityCommunicationChannel" AS ENUM ('in_app', 'sms', 'email', 'phone_human', 'postal_human', 'interpreter_required');
-- CreateEnum
CREATE TYPE "ContinuityCommunicationStatus" AS ENUM ('drafted', 'queued', 'sent', 'delivered', 'failed', 'suppressed_no_consent');
-- CreateEnum
CREATE TYPE "ContinuityReservationStatus" AS ENUM ('held', 'confirmed', 'released', 'expired', 'cancelled');
-- CreateEnum
CREATE TYPE "ContinuityOutcomeSignal" AS ENUM ('goal_preserved', 'goal_partially_preserved', 'goal_missed', 'participant_declined_all_options', 'no_safe_option_available', 'human_escalated', 'unknown');
-- CreateEnum
CREATE TYPE "CivicFeedRegistrationStatus" AS ENUM ('proposed', 'disabled', 'approved', 'suspended', 'retired');
-- AlterTable
ALTER TABLE "orchestration_reschedule_requests" ADD COLUMN     "coordinatorId" TEXT,
ADD COLUMN     "organisationId" TEXT;
-- CreateTable
CREATE TABLE "continuity_life_events" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "organisationId" TEXT,
    "kind" "LifeEventKind" NOT NULL,
    "status" "LifeEventStatus" NOT NULL DEFAULT 'draft',
    "source" "LifeEventSource" NOT NULL DEFAULT 'participant_self',
    "declaredById" TEXT NOT NULL,
    "confirmedById" TEXT,
    "title" TEXT NOT NULL,
    "narrative" TEXT,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "detailsJson" JSONB,
    "confidence" "ContinuitySignalConfidence" NOT NULL DEFAULT 'medium',
    "provenanceJson" JSONB,
    "aiSuggested" BOOLEAN NOT NULL DEFAULT false,
    "autoCreated" BOOLEAN NOT NULL DEFAULT false,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "continuity_life_events_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "continuity_signals" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT,
    "participantId" TEXT,
    "kind" "ContinuitySignalKind" NOT NULL,
    "status" "ContinuitySignalStatus" NOT NULL DEFAULT 'received',
    "confidence" "ContinuitySignalConfidence" NOT NULL DEFAULT 'low',
    "sourceRef" TEXT,
    "sourceKind" TEXT,
    "lifeEventId" TEXT,
    "payloadJson" JSONB,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "validatedAt" TIMESTAMP(3),
    "staleAfter" TIMESTAMP(3),
    "dedupeKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "continuity_signals_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "participant_continuity_profiles" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "organisationId" TEXT,
    "goalsNarrative" TEXT,
    "essentialSupportsJson" JSONB,
    "prohibitedActionsJson" JSONB,
    "communicationPreferenceJson" JSONB,
    "interpreterRequired" BOOLEAN NOT NULL DEFAULT false,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "participant_continuity_profiles_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "continuity_requirements" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "essential" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT NOT NULL,
    "detailsJson" JSONB,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "continuity_requirements_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "continuity_standing_recovery_instructions" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "scope" "StandingRecoveryInstructionScope" NOT NULL,
    "status" "StandingRecoveryInstructionStatus" NOT NULL DEFAULT 'draft',
    "title" TEXT NOT NULL,
    "instructionsJson" JSONB NOT NULL,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "revokedById" TEXT,
    "revokedAt" TIMESTAMP(3),
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "continuity_standing_recovery_instructions_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "continuity_node_references" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT,
    "participantId" TEXT,
    "kind" "ContinuityNodeKind" NOT NULL,
    "referenceKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "continuity_node_references_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "continuity_dependencies" (
    "id" TEXT NOT NULL,
    "fromNodeId" TEXT NOT NULL,
    "toNodeId" TEXT NOT NULL,
    "kind" "ContinuityDependencyKind" NOT NULL,
    "provenance" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "detailsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "continuity_dependencies_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "continuity_impact_assessments" (
    "id" TEXT NOT NULL,
    "caseId" TEXT,
    "participantId" TEXT,
    "organisationId" TEXT,
    "level" "ContinuityImpactLevel" NOT NULL,
    "narrative" TEXT,
    "affectedNodesJson" JSONB,
    "brokenDependenciesJson" JSONB,
    "computedById" TEXT,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "continuity_impact_assessments_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "continuity_cases" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT,
    "participantId" TEXT NOT NULL,
    "category" "ContinuityCaseCategory" NOT NULL,
    "status" "ContinuityCaseStatus" NOT NULL DEFAULT 'open',
    "priority" "ContinuityCasePriority" NOT NULL DEFAULT 'medium',
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "coordinatorId" TEXT,
    "linkedCaseId" TEXT,
    "goalsPreservedJson" JSONB,
    "contextJson" JSONB,
    "openedById" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedById" TEXT,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "continuity_cases_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "continuity_recovery_options" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "kind" "RecoveryOptionKind" NOT NULL,
    "eligibility" "RecoveryOptionEligibility" NOT NULL,
    "rationale" TEXT NOT NULL,
    "narrative" TEXT,
    "deterministicKey" TEXT NOT NULL,
    "detailsJson" JSONB,
    "preservesGoal" BOOLEAN NOT NULL DEFAULT false,
    "requiresConsent" BOOLEAN NOT NULL DEFAULT false,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "continuity_recovery_options_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "continuity_recovery_plans" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "status" "RecoveryPlanStatus" NOT NULL DEFAULT 'draft',
    "selectedOptionId" TEXT,
    "simulationJson" JSONB,
    "narrative" TEXT,
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "cancelledById" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "continuity_recovery_plans_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "continuity_recovery_plan_steps" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "stepIndex" INTEGER NOT NULL,
    "kind" "RecoveryPlanStepKind" NOT NULL,
    "status" "RecoveryPlanStepStatus" NOT NULL DEFAULT 'pending',
    "narrative" TEXT NOT NULL,
    "detailsJson" JSONB,
    "compensationJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "continuity_recovery_plan_steps_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "continuity_recovery_executions" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "RecoveryPlanStatus" NOT NULL DEFAULT 'executing',
    "idempotencyKey" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "errorNarrative" TEXT,
    "snapshotJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "continuity_recovery_executions_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "continuity_capacity_reservations" (
    "id" TEXT NOT NULL,
    "caseId" TEXT,
    "organisationId" TEXT,
    "resourceKind" TEXT NOT NULL,
    "resourceRef" TEXT NOT NULL,
    "status" "ContinuityReservationStatus" NOT NULL DEFAULT 'held',
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "detailsJson" JSONB,
    "createdById" TEXT NOT NULL,
    "releasedById" TEXT,
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "continuity_capacity_reservations_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "continuity_outcomes" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "signal" "ContinuityOutcomeSignal" NOT NULL,
    "narrative" TEXT,
    "observedById" TEXT,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "detailsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "continuity_outcomes_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "continuity_communication_attempts" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "channel" "ContinuityCommunicationChannel" NOT NULL,
    "status" "ContinuityCommunicationStatus" NOT NULL DEFAULT 'drafted',
    "toReference" TEXT NOT NULL,
    "bodySnapshot" TEXT,
    "suppressedReason" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "continuity_communication_attempts_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "continuity_civic_feed_registrations" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "provenanceUrl" TEXT NOT NULL,
    "status" "CivicFeedRegistrationStatus" NOT NULL DEFAULT 'disabled',
    "freshnessTtlMinutes" INTEGER NOT NULL DEFAULT 60,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "productionActivated" BOOLEAN NOT NULL DEFAULT false,
    "detailsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "continuity_civic_feed_registrations_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "_ContinuitySignalCases" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ContinuitySignalCases_AB_pkey" PRIMARY KEY ("A","B")
);
-- CreateIndex
CREATE INDEX "continuity_life_events_participantId_status_idx" ON "continuity_life_events"("participantId", "status");
-- CreateIndex
CREATE INDEX "continuity_life_events_organisationId_status_idx" ON "continuity_life_events"("organisationId", "status");
-- CreateIndex
CREATE INDEX "continuity_life_events_kind_status_idx" ON "continuity_life_events"("kind", "status");
-- CreateIndex
CREATE UNIQUE INDEX "continuity_signals_dedupeKey_key" ON "continuity_signals"("dedupeKey");
-- CreateIndex
CREATE INDEX "continuity_signals_participantId_status_idx" ON "continuity_signals"("participantId", "status");
-- CreateIndex
CREATE INDEX "continuity_signals_organisationId_status_idx" ON "continuity_signals"("organisationId", "status");
-- CreateIndex
CREATE INDEX "continuity_signals_kind_status_idx" ON "continuity_signals"("kind", "status");
-- CreateIndex
CREATE INDEX "continuity_signals_observedAt_idx" ON "continuity_signals"("observedAt");
-- CreateIndex
CREATE UNIQUE INDEX "participant_continuity_profiles_participantId_key" ON "participant_continuity_profiles"("participantId");
-- CreateIndex
CREATE INDEX "participant_continuity_profiles_organisationId_idx" ON "participant_continuity_profiles"("organisationId");
-- CreateIndex
CREATE INDEX "continuity_requirements_profileId_essential_idx" ON "continuity_requirements"("profileId", "essential");
-- CreateIndex
CREATE INDEX "continuity_standing_recovery_instructions_profileId_status_idx" ON "continuity_standing_recovery_instructions"("profileId", "status");
-- CreateIndex
CREATE INDEX "continuity_standing_recovery_instructions_scope_status_idx" ON "continuity_standing_recovery_instructions"("scope", "status");
-- CreateIndex
CREATE INDEX "continuity_node_references_participantId_kind_idx" ON "continuity_node_references"("participantId", "kind");
-- CreateIndex
CREATE INDEX "continuity_node_references_organisationId_kind_idx" ON "continuity_node_references"("organisationId", "kind");
-- CreateIndex
CREATE UNIQUE INDEX "continuity_node_references_kind_referenceKey_key" ON "continuity_node_references"("kind", "referenceKey");
-- CreateIndex
CREATE INDEX "continuity_dependencies_toNodeId_kind_idx" ON "continuity_dependencies"("toNodeId", "kind");
-- CreateIndex
CREATE UNIQUE INDEX "continuity_dependencies_fromNodeId_toNodeId_kind_key" ON "continuity_dependencies"("fromNodeId", "toNodeId", "kind");
-- CreateIndex
CREATE UNIQUE INDEX "continuity_impact_assessments_caseId_key" ON "continuity_impact_assessments"("caseId");
-- CreateIndex
CREATE INDEX "continuity_impact_assessments_participantId_idx" ON "continuity_impact_assessments"("participantId");
-- CreateIndex
CREATE INDEX "continuity_impact_assessments_organisationId_idx" ON "continuity_impact_assessments"("organisationId");
-- CreateIndex
CREATE INDEX "continuity_cases_organisationId_status_idx" ON "continuity_cases"("organisationId", "status");
-- CreateIndex
CREATE INDEX "continuity_cases_participantId_status_idx" ON "continuity_cases"("participantId", "status");
-- CreateIndex
CREATE INDEX "continuity_cases_coordinatorId_status_idx" ON "continuity_cases"("coordinatorId", "status");
-- CreateIndex
CREATE INDEX "continuity_cases_category_status_idx" ON "continuity_cases"("category", "status");
-- CreateIndex
CREATE INDEX "continuity_recovery_options_caseId_eligibility_idx" ON "continuity_recovery_options"("caseId", "eligibility");
-- CreateIndex
CREATE UNIQUE INDEX "continuity_recovery_options_caseId_deterministicKey_key" ON "continuity_recovery_options"("caseId", "deterministicKey");
-- CreateIndex
CREATE INDEX "continuity_recovery_plans_caseId_status_idx" ON "continuity_recovery_plans"("caseId", "status");
-- CreateIndex
CREATE INDEX "continuity_recovery_plan_steps_planId_status_idx" ON "continuity_recovery_plan_steps"("planId", "status");
-- CreateIndex
CREATE UNIQUE INDEX "continuity_recovery_plan_steps_planId_stepIndex_key" ON "continuity_recovery_plan_steps"("planId", "stepIndex");
-- CreateIndex
CREATE UNIQUE INDEX "continuity_recovery_executions_idempotencyKey_key" ON "continuity_recovery_executions"("idempotencyKey");
-- CreateIndex
CREATE INDEX "continuity_recovery_executions_planId_status_idx" ON "continuity_recovery_executions"("planId", "status");
-- CreateIndex
CREATE INDEX "continuity_capacity_reservations_resourceKind_status_idx" ON "continuity_capacity_reservations"("resourceKind", "status");
-- CreateIndex
CREATE INDEX "continuity_capacity_reservations_caseId_status_idx" ON "continuity_capacity_reservations"("caseId", "status");
-- CreateIndex
CREATE INDEX "continuity_capacity_reservations_organisationId_status_idx" ON "continuity_capacity_reservations"("organisationId", "status");
-- CreateIndex
CREATE INDEX "continuity_outcomes_caseId_signal_idx" ON "continuity_outcomes"("caseId", "signal");
-- CreateIndex
CREATE INDEX "continuity_communication_attempts_caseId_status_idx" ON "continuity_communication_attempts"("caseId", "status");
-- CreateIndex
CREATE UNIQUE INDEX "continuity_civic_feed_registrations_slug_key" ON "continuity_civic_feed_registrations"("slug");
-- CreateIndex
CREATE INDEX "continuity_civic_feed_registrations_status_idx" ON "continuity_civic_feed_registrations"("status");
-- CreateIndex
CREATE INDEX "_ContinuitySignalCases_B_index" ON "_ContinuitySignalCases"("B");
-- CreateIndex
CREATE INDEX "orchestration_reschedule_requests_coordinatorId_status_idx" ON "orchestration_reschedule_requests"("coordinatorId", "status");
-- CreateIndex
CREATE INDEX "orchestration_reschedule_requests_organisationId_status_idx" ON "orchestration_reschedule_requests"("organisationId", "status");
-- AddForeignKey
ALTER TABLE "continuity_signals" ADD CONSTRAINT "continuity_signals_lifeEventId_fkey" FOREIGN KEY ("lifeEventId") REFERENCES "continuity_life_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "continuity_requirements" ADD CONSTRAINT "continuity_requirements_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "participant_continuity_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "continuity_standing_recovery_instructions" ADD CONSTRAINT "continuity_standing_recovery_instructions_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "participant_continuity_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "continuity_dependencies" ADD CONSTRAINT "continuity_dependencies_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES "continuity_node_references"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "continuity_dependencies" ADD CONSTRAINT "continuity_dependencies_toNodeId_fkey" FOREIGN KEY ("toNodeId") REFERENCES "continuity_node_references"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "continuity_impact_assessments" ADD CONSTRAINT "continuity_impact_assessments_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "continuity_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "continuity_cases" ADD CONSTRAINT "continuity_cases_linkedCaseId_fkey" FOREIGN KEY ("linkedCaseId") REFERENCES "cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "continuity_recovery_options" ADD CONSTRAINT "continuity_recovery_options_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "continuity_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "continuity_recovery_plans" ADD CONSTRAINT "continuity_recovery_plans_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "continuity_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "continuity_recovery_plan_steps" ADD CONSTRAINT "continuity_recovery_plan_steps_planId_fkey" FOREIGN KEY ("planId") REFERENCES "continuity_recovery_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "continuity_recovery_executions" ADD CONSTRAINT "continuity_recovery_executions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "continuity_recovery_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "continuity_capacity_reservations" ADD CONSTRAINT "continuity_capacity_reservations_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "continuity_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "continuity_outcomes" ADD CONSTRAINT "continuity_outcomes_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "continuity_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "continuity_communication_attempts" ADD CONSTRAINT "continuity_communication_attempts_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "continuity_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "_ContinuitySignalCases" ADD CONSTRAINT "_ContinuitySignalCases_A_fkey" FOREIGN KEY ("A") REFERENCES "continuity_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "_ContinuitySignalCases" ADD CONSTRAINT "_ContinuitySignalCases_B_fkey" FOREIGN KEY ("B") REFERENCES "continuity_signals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
