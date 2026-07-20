-- Positive Behaviour Support foundation (controlled pilot)
-- Domain owner: lib/positive-behaviour-support/
-- Additive only. Does not lodge with or substitute NDIS Commission processes.

-- AlterEnum
ALTER TYPE "ConsentScope" ADD VALUE 'behaviour_support_share';
ALTER TYPE "DocumentCategory" ADD VALUE 'behaviour_support_plan';

-- CreateEnum
CREATE TYPE "PbsSuitabilityStatus" AS ENUM ('claimed', 'pending_verification', 'verified', 'rejected', 'expired', 'revoked');
CREATE TYPE "PbsEngagementStatus" AS ENUM ('draft', 'active', 'paused', 'closed', 'archived');
CREATE TYPE "PbsPlanType" AS ENUM ('interim', 'comprehensive');
CREATE TYPE "PbsPlanStatus" AS ENUM ('draft', 'assessment_in_progress', 'consultation', 'practitioner_review', 'finalised', 'active', 'review_due', 'superseded', 'archived');
CREATE TYPE "PbsAnswerStatus" AS ENUM ('answered', 'skipped', 'unknown', 'paused', 'disagreed', 'corrected');
CREATE TYPE "PbsRpClassification" AS ENUM ('not_restrictive', 'possible_restrictive', 'regulated_restrictive', 'unclassified');
CREATE TYPE "PbsRpAuthorisationStatus" AS ENUM ('not_required', 'required_missing', 'pending_external', 'recorded_external', 'gap_blocks_activation');
CREATE TYPE "PbsStatementAcceptance" AS ENUM ('candidate', 'accepted', 'corrected', 'rejected');
CREATE TYPE "PbsDeidentificationStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "pbs_provider_profiles" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "claimedRegistrationGroup" TEXT,
    "registrationClaimed" BOOLEAN NOT NULL DEFAULT false,
    "registrationVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationNotes" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedByUserId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pbs_provider_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pbs_practitioner_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "providerProfileId" TEXT,
    "claimedCredential" TEXT,
    "suitabilityStatus" "PbsSuitabilityStatus" NOT NULL DEFAULT 'claimed',
    "verifiedAt" TIMESTAMP(3),
    "verifiedByUserId" TEXT,
    "verificationRecordRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pbs_practitioner_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pbs_engagements" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "participantUserId" TEXT NOT NULL,
    "providerProfileId" TEXT,
    "assignedPractitionerProfileId" TEXT,
    "status" "PbsEngagementStatus" NOT NULL DEFAULT 'draft',
    "consentRecordId" TEXT,
    "authorityGrantId" TEXT,
    "sourceChecklistVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pbs_engagements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pbs_questionnaire_sessions" (
    "id" TEXT NOT NULL,
    "engagementId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "participantUserId" TEXT NOT NULL,
    "questionnaireVersion" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "easyReadMode" BOOLEAN NOT NULL DEFAULT false,
    "autosaveStatus" TEXT NOT NULL DEFAULT 'idle',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pbs_questionnaire_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pbs_questionnaire_responses" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "status" "PbsAnswerStatus" NOT NULL DEFAULT 'unknown',
    "valueText" TEXT,
    "suppliedByUserId" TEXT NOT NULL,
    "informantRole" TEXT NOT NULL,
    "disagreementNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pbs_questionnaire_responses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pbs_observations" (
    "id" TEXT NOT NULL,
    "engagementId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "participantUserId" TEXT NOT NULL,
    "recordedByUserId" TEXT NOT NULL,
    "observedAt" TIMESTAMP(3),
    "antecedentText" TEXT,
    "behaviourText" TEXT,
    "consequenceText" TEXT,
    "contextText" TEXT,
    "frequencyBand" TEXT,
    "intensityBand" TEXT,
    "isUnknown" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pbs_observations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pbs_assessments" (
    "id" TEXT NOT NULL,
    "engagementId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "participantUserId" TEXT NOT NULL,
    "practitionerUserId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "isFunctionalBehaviourAssessment" BOOLEAN NOT NULL DEFAULT false,
    "questionnaireAloneCannotFinalise" BOOLEAN NOT NULL DEFAULT true,
    "requiredSectionsComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pbs_assessments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pbs_behaviour_definitions" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "observableDescription" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pbs_behaviour_definitions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pbs_working_hypotheses" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "statementText" TEXT NOT NULL,
    "isClinicalDetermination" BOOLEAN NOT NULL DEFAULT false,
    "recordedByPractitioner" BOOLEAN NOT NULL DEFAULT false,
    "unresolved" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pbs_working_hypotheses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pbs_plans" (
    "id" TEXT NOT NULL,
    "engagementId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "participantUserId" TEXT NOT NULL,
    "practitionerUserId" TEXT,
    "planType" "PbsPlanType" NOT NULL DEFAULT 'interim',
    "status" "PbsPlanStatus" NOT NULL DEFAULT 'draft',
    "currentVersionNumber" INTEGER NOT NULL DEFAULT 1,
    "sourceChecklistVersion" TEXT,
    "unresolvedConflictAcknowledged" BOOLEAN NOT NULL DEFAULT false,
    "practitionerDeclarationAt" TIMESTAMP(3),
    "participantFeedbackObtained" BOOLEAN NOT NULL DEFAULT false,
    "participantFeedbackUnavailableReason" TEXT,
    "consultationEvidencePresent" BOOLEAN NOT NULL DEFAULT false,
    "finalisedAt" TIMESTAMP(3),
    "activatedAt" TIMESTAMP(3),
    "reviewDueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pbs_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pbs_plan_versions" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "status" "PbsPlanStatus" NOT NULL,
    "immutable" BOOLEAN NOT NULL DEFAULT false,
    "changeSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pbs_plan_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pbs_plan_sections" (
    "id" TEXT NOT NULL,
    "planVersionId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "bodyText" TEXT,
    "aiAssisted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pbs_plan_sections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pbs_strategies" (
    "id" TEXT NOT NULL,
    "planVersionId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "detailText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pbs_strategies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pbs_consultation_records" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "practitionerUserId" TEXT,
    "accessibleFormat" TEXT NOT NULL,
    "summary" TEXT,
    "consultedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pbs_consultation_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pbs_participant_feedback" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "participantUserId" TEXT NOT NULL,
    "agrees" BOOLEAN,
    "feedbackText" TEXT,
    "challengeNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pbs_participant_feedback_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pbs_restrictive_practice_records" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "classification" "PbsRpClassification" NOT NULL DEFAULT 'unclassified',
    "jurisdiction" TEXT,
    "authorisationStatus" "PbsRpAuthorisationStatus" NOT NULL DEFAULT 'required_missing',
    "checklistVersion" TEXT NOT NULL,
    "leastRestrictiveChecked" BOOLEAN NOT NULL DEFAULT false,
    "lastResortChecked" BOOLEAN NOT NULL DEFAULT false,
    "proportionalityChecked" BOOLEAN NOT NULL DEFAULT false,
    "shortestDurationChecked" BOOLEAN NOT NULL DEFAULT false,
    "reductionEliminationPlanRecorded" BOOLEAN NOT NULL DEFAULT false,
    "monitoringReviewArrangementsRecorded" BOOLEAN NOT NULL DEFAULT false,
    "consultationAccessibleFormatRecorded" BOOLEAN NOT NULL DEFAULT false,
    "manualClassificationByPractitioner" BOOLEAN NOT NULL DEFAULT false,
    "aiDraftingSuspended" BOOLEAN NOT NULL DEFAULT true,
    "highPriorityReview" BOOLEAN NOT NULL DEFAULT true,
    "activationBlocked" BOOLEAN NOT NULL DEFAULT true,
    "checklistJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pbs_restrictive_practice_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pbs_implementation_assignments" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "acknowledgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pbs_implementation_assignments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pbs_implementation_records" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "monitoringNote" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pbs_implementation_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pbs_reviews" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "practitionerUserId" TEXT,
    "outcome" TEXT,
    "nextReviewAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pbs_reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pbs_ai_assistance_runs" (
    "id" TEXT NOT NULL,
    "engagementId" TEXT NOT NULL,
    "planId" TEXT,
    "organisationId" TEXT NOT NULL,
    "requesterUserId" TEXT,
    "reviewerUserId" TEXT,
    "action" TEXT NOT NULL,
    "authorityCeiling" TEXT NOT NULL DEFAULT 'DRAFT_ONLY',
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "inputHash" TEXT NOT NULL,
    "outputHash" TEXT NOT NULL,
    "unknownsJson" JSONB NOT NULL DEFAULT '[]',
    "conflictsJson" JSONB NOT NULL DEFAULT '[]',
    "externalModelUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pbs_ai_assistance_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pbs_statement_provenances" (
    "id" TEXT NOT NULL,
    "planVersionId" TEXT,
    "aiRunId" TEXT,
    "organisationId" TEXT NOT NULL,
    "statementText" TEXT NOT NULL,
    "sourceRef" TEXT,
    "acceptance" "PbsStatementAcceptance" NOT NULL DEFAULT 'candidate',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pbs_statement_provenances_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pbs_deidentification_reviews" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "engagementId" TEXT,
    "practitionerUserId" TEXT NOT NULL,
    "status" "PbsDeidentificationStatus" NOT NULL DEFAULT 'pending',
    "payloadHash" TEXT NOT NULL,
    "approvedExactPayloadHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pbs_deidentification_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pbs_provider_profiles_organisationId_key" ON "pbs_provider_profiles"("organisationId");
CREATE INDEX "pbs_provider_profiles_organisationId_registrationVerified_idx" ON "pbs_provider_profiles"("organisationId", "registrationVerified");
CREATE UNIQUE INDEX "pbs_practitioner_profiles_userId_organisationId_key" ON "pbs_practitioner_profiles"("userId", "organisationId");
CREATE INDEX "pbs_practitioner_profiles_organisationId_suitabilityStatus_idx" ON "pbs_practitioner_profiles"("organisationId", "suitabilityStatus");
CREATE INDEX "pbs_practitioner_profiles_userId_idx" ON "pbs_practitioner_profiles"("userId");
CREATE INDEX "pbs_engagements_participantUserId_status_idx" ON "pbs_engagements"("participantUserId", "status");
CREATE INDEX "pbs_engagements_organisationId_status_idx" ON "pbs_engagements"("organisationId", "status");
CREATE INDEX "pbs_engagements_assignedPractitionerProfileId_idx" ON "pbs_engagements"("assignedPractitionerProfileId");
CREATE INDEX "pbs_questionnaire_sessions_engagementId_idx" ON "pbs_questionnaire_sessions"("engagementId");
CREATE INDEX "pbs_questionnaire_sessions_participantUserId_idx" ON "pbs_questionnaire_sessions"("participantUserId");
CREATE INDEX "pbs_questionnaire_sessions_organisationId_idx" ON "pbs_questionnaire_sessions"("organisationId");
CREATE INDEX "pbs_questionnaire_responses_sessionId_sectionKey_idx" ON "pbs_questionnaire_responses"("sessionId", "sectionKey");
CREATE INDEX "pbs_questionnaire_responses_organisationId_idx" ON "pbs_questionnaire_responses"("organisationId");
CREATE INDEX "pbs_questionnaire_responses_suppliedByUserId_idx" ON "pbs_questionnaire_responses"("suppliedByUserId");
CREATE INDEX "pbs_observations_engagementId_idx" ON "pbs_observations"("engagementId");
CREATE INDEX "pbs_observations_organisationId_participantUserId_idx" ON "pbs_observations"("organisationId", "participantUserId");
CREATE INDEX "pbs_assessments_engagementId_idx" ON "pbs_assessments"("engagementId");
CREATE INDEX "pbs_assessments_organisationId_participantUserId_idx" ON "pbs_assessments"("organisationId", "participantUserId");
CREATE INDEX "pbs_behaviour_definitions_assessmentId_idx" ON "pbs_behaviour_definitions"("assessmentId");
CREATE INDEX "pbs_behaviour_definitions_organisationId_idx" ON "pbs_behaviour_definitions"("organisationId");
CREATE INDEX "pbs_working_hypotheses_assessmentId_idx" ON "pbs_working_hypotheses"("assessmentId");
CREATE INDEX "pbs_working_hypotheses_organisationId_idx" ON "pbs_working_hypotheses"("organisationId");
CREATE INDEX "pbs_plans_engagementId_status_idx" ON "pbs_plans"("engagementId", "status");
CREATE INDEX "pbs_plans_organisationId_participantUserId_idx" ON "pbs_plans"("organisationId", "participantUserId");
CREATE INDEX "pbs_plans_practitionerUserId_idx" ON "pbs_plans"("practitionerUserId");
CREATE UNIQUE INDEX "pbs_plan_versions_planId_versionNumber_key" ON "pbs_plan_versions"("planId", "versionNumber");
CREATE INDEX "pbs_plan_versions_organisationId_idx" ON "pbs_plan_versions"("organisationId");
CREATE INDEX "pbs_plan_sections_planVersionId_sectionKey_idx" ON "pbs_plan_sections"("planVersionId", "sectionKey");
CREATE INDEX "pbs_plan_sections_organisationId_idx" ON "pbs_plan_sections"("organisationId");
CREATE INDEX "pbs_strategies_planVersionId_idx" ON "pbs_strategies"("planVersionId");
CREATE INDEX "pbs_strategies_organisationId_idx" ON "pbs_strategies"("organisationId");
CREATE INDEX "pbs_consultation_records_planId_idx" ON "pbs_consultation_records"("planId");
CREATE INDEX "pbs_consultation_records_organisationId_idx" ON "pbs_consultation_records"("organisationId");
CREATE INDEX "pbs_participant_feedback_planId_idx" ON "pbs_participant_feedback"("planId");
CREATE INDEX "pbs_participant_feedback_organisationId_participantUserId_idx" ON "pbs_participant_feedback"("organisationId", "participantUserId");
CREATE INDEX "pbs_restrictive_practice_records_planId_idx" ON "pbs_restrictive_practice_records"("planId");
CREATE INDEX "pbs_restrictive_practice_records_organisationId_authorisationStatus_idx" ON "pbs_restrictive_practice_records"("organisationId", "authorisationStatus");
CREATE INDEX "pbs_implementation_assignments_planId_idx" ON "pbs_implementation_assignments"("planId");
CREATE INDEX "pbs_implementation_assignments_organisationId_status_idx" ON "pbs_implementation_assignments"("organisationId", "status");
CREATE INDEX "pbs_implementation_records_assignmentId_idx" ON "pbs_implementation_records"("assignmentId");
CREATE INDEX "pbs_implementation_records_organisationId_idx" ON "pbs_implementation_records"("organisationId");
CREATE INDEX "pbs_reviews_planId_idx" ON "pbs_reviews"("planId");
CREATE INDEX "pbs_reviews_organisationId_idx" ON "pbs_reviews"("organisationId");
CREATE INDEX "pbs_ai_assistance_runs_engagementId_idx" ON "pbs_ai_assistance_runs"("engagementId");
CREATE INDEX "pbs_ai_assistance_runs_planId_idx" ON "pbs_ai_assistance_runs"("planId");
CREATE INDEX "pbs_ai_assistance_runs_organisationId_idx" ON "pbs_ai_assistance_runs"("organisationId");
CREATE INDEX "pbs_statement_provenances_planVersionId_idx" ON "pbs_statement_provenances"("planVersionId");
CREATE INDEX "pbs_statement_provenances_aiRunId_idx" ON "pbs_statement_provenances"("aiRunId");
CREATE INDEX "pbs_statement_provenances_organisationId_idx" ON "pbs_statement_provenances"("organisationId");
CREATE INDEX "pbs_deidentification_reviews_organisationId_status_idx" ON "pbs_deidentification_reviews"("organisationId", "status");
CREATE INDEX "pbs_deidentification_reviews_practitionerUserId_idx" ON "pbs_deidentification_reviews"("practitionerUserId");

-- AddForeignKey
ALTER TABLE "pbs_provider_profiles" ADD CONSTRAINT "pbs_provider_profiles_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pbs_practitioner_profiles" ADD CONSTRAINT "pbs_practitioner_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pbs_practitioner_profiles" ADD CONSTRAINT "pbs_practitioner_profiles_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pbs_practitioner_profiles" ADD CONSTRAINT "pbs_practitioner_profiles_providerProfileId_fkey" FOREIGN KEY ("providerProfileId") REFERENCES "pbs_provider_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pbs_practitioner_profiles" ADD CONSTRAINT "pbs_practitioner_profiles_verifiedByUserId_fkey" FOREIGN KEY ("verifiedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pbs_engagements" ADD CONSTRAINT "pbs_engagements_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pbs_engagements" ADD CONSTRAINT "pbs_engagements_participantUserId_fkey" FOREIGN KEY ("participantUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pbs_engagements" ADD CONSTRAINT "pbs_engagements_providerProfileId_fkey" FOREIGN KEY ("providerProfileId") REFERENCES "pbs_provider_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pbs_engagements" ADD CONSTRAINT "pbs_engagements_assignedPractitionerProfileId_fkey" FOREIGN KEY ("assignedPractitionerProfileId") REFERENCES "pbs_practitioner_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pbs_questionnaire_sessions" ADD CONSTRAINT "pbs_questionnaire_sessions_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "pbs_engagements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pbs_questionnaire_responses" ADD CONSTRAINT "pbs_questionnaire_responses_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "pbs_questionnaire_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pbs_questionnaire_responses" ADD CONSTRAINT "pbs_questionnaire_responses_suppliedByUserId_fkey" FOREIGN KEY ("suppliedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pbs_observations" ADD CONSTRAINT "pbs_observations_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "pbs_engagements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pbs_observations" ADD CONSTRAINT "pbs_observations_recordedByUserId_fkey" FOREIGN KEY ("recordedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pbs_assessments" ADD CONSTRAINT "pbs_assessments_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "pbs_engagements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pbs_assessments" ADD CONSTRAINT "pbs_assessments_practitionerUserId_fkey" FOREIGN KEY ("practitionerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pbs_behaviour_definitions" ADD CONSTRAINT "pbs_behaviour_definitions_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "pbs_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pbs_working_hypotheses" ADD CONSTRAINT "pbs_working_hypotheses_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "pbs_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pbs_plans" ADD CONSTRAINT "pbs_plans_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "pbs_engagements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pbs_plans" ADD CONSTRAINT "pbs_plans_practitionerUserId_fkey" FOREIGN KEY ("practitionerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pbs_plan_versions" ADD CONSTRAINT "pbs_plan_versions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "pbs_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pbs_plan_sections" ADD CONSTRAINT "pbs_plan_sections_planVersionId_fkey" FOREIGN KEY ("planVersionId") REFERENCES "pbs_plan_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pbs_strategies" ADD CONSTRAINT "pbs_strategies_planVersionId_fkey" FOREIGN KEY ("planVersionId") REFERENCES "pbs_plan_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pbs_consultation_records" ADD CONSTRAINT "pbs_consultation_records_planId_fkey" FOREIGN KEY ("planId") REFERENCES "pbs_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pbs_consultation_records" ADD CONSTRAINT "pbs_consultation_records_practitionerUserId_fkey" FOREIGN KEY ("practitionerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pbs_participant_feedback" ADD CONSTRAINT "pbs_participant_feedback_planId_fkey" FOREIGN KEY ("planId") REFERENCES "pbs_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pbs_participant_feedback" ADD CONSTRAINT "pbs_participant_feedback_participantUserId_fkey" FOREIGN KEY ("participantUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pbs_restrictive_practice_records" ADD CONSTRAINT "pbs_restrictive_practice_records_planId_fkey" FOREIGN KEY ("planId") REFERENCES "pbs_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pbs_implementation_assignments" ADD CONSTRAINT "pbs_implementation_assignments_planId_fkey" FOREIGN KEY ("planId") REFERENCES "pbs_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pbs_implementation_assignments" ADD CONSTRAINT "pbs_implementation_assignments_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pbs_implementation_records" ADD CONSTRAINT "pbs_implementation_records_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "pbs_implementation_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pbs_reviews" ADD CONSTRAINT "pbs_reviews_planId_fkey" FOREIGN KEY ("planId") REFERENCES "pbs_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pbs_reviews" ADD CONSTRAINT "pbs_reviews_practitionerUserId_fkey" FOREIGN KEY ("practitionerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pbs_ai_assistance_runs" ADD CONSTRAINT "pbs_ai_assistance_runs_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "pbs_engagements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pbs_ai_assistance_runs" ADD CONSTRAINT "pbs_ai_assistance_runs_planId_fkey" FOREIGN KEY ("planId") REFERENCES "pbs_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pbs_ai_assistance_runs" ADD CONSTRAINT "pbs_ai_assistance_runs_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pbs_ai_assistance_runs" ADD CONSTRAINT "pbs_ai_assistance_runs_reviewerUserId_fkey" FOREIGN KEY ("reviewerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pbs_statement_provenances" ADD CONSTRAINT "pbs_statement_provenances_planVersionId_fkey" FOREIGN KEY ("planVersionId") REFERENCES "pbs_plan_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pbs_statement_provenances" ADD CONSTRAINT "pbs_statement_provenances_aiRunId_fkey" FOREIGN KEY ("aiRunId") REFERENCES "pbs_ai_assistance_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pbs_deidentification_reviews" ADD CONSTRAINT "pbs_deidentification_reviews_practitionerUserId_fkey" FOREIGN KEY ("practitionerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
