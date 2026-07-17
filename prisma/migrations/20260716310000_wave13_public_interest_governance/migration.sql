-- MapAble Wave 13: Public-interest governance.
-- Forward-only. Extends Wave 12 scaffolds without dropping or replacing
-- RegisteredAlgorithm, CommunityGovernanceMeeting, CommunityGovernanceDecision,
-- Complaint or AiGovernanceIncident.

-- Additive fields on existing community governance scaffolds.
ALTER TABLE "CommunityGovernanceMeeting" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "CommunityGovernanceMeeting" ADD COLUMN "constituencySummary" TEXT;
ALTER TABLE "CommunityGovernanceDecision" ADD COLUMN "constituencySummary" TEXT;
ALTER TABLE "CommunityGovernanceDecision" ADD COLUMN "conflictCheckCompleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateEnum
CREATE TYPE "GovernedSystemType" AS ENUM ('deterministic_rule', 'ranking', 'recommendation', 'predictive_model', 'generative_model', 'optimisation', 'matching', 'moderation', 'fraud_or_anomaly_detection', 'identity_or_credential', 'access_control', 'workflow_automation', 'reporting', 'other');

-- CreateEnum
CREATE TYPE "DecisionImpact" AS ENUM ('informational', 'low', 'moderate', 'high', 'rights_affecting', 'safety_relevant', 'financial', 'legally_significant', 'prohibited_for_automation');

-- CreateEnum
CREATE TYPE "GovernedDecisionStatus" AS ENUM ('proposed', 'pending', 'issued', 'challenged', 'under_review', 'varied', 'withdrawn', 'upheld', 'overturned', 'remitted', 'expired', 'archived');

-- CreateEnum
CREATE TYPE "AppealStatus" AS ENUM ('draft', 'submitted', 'acknowledged', 'triage', 'information_requested', 'reviewer_assigned', 'under_review', 'participant_response', 'decision_pending', 'resolved', 'withdrawn', 'escalated', 'closed');

-- CreateEnum
CREATE TYPE "AiaStatus" AS ENUM ('draft', 'in_assessment', 'under_review', 'approved', 'conditional', 'rejected', 'expired', 'retired');

-- CreateEnum
CREATE TYPE "AppealGroundType" AS ENUM ('factual_error', 'process_unfair', 'discrimination', 'accessibility_barrier', 'consent_misuse', 'incorrect_evidence', 'disproportionate_effect', 'human_oversight_absent', 'other');

-- CreateEnum
CREATE TYPE "RemedyActionType" AS ENUM ('reverse_decision', 'vary_decision', 'republish_corrected', 'restore_access', 'notify_downstream', 'apologise', 'retrain_process', 'other');

-- CreateEnum
CREATE TYPE "OversightBodyType" AS ENUM ('community_panel', 'independent_review_board', 'technical_advisory', 'privacy_security', 'first_nations', 'other');

-- CreateEnum
CREATE TYPE "PublicationVisibility" AS ENUM ('public', 'authenticated', 'sealed', 'internal');

-- CreateTable
CREATE TABLE "pig_governed_systems" (
    "id" TEXT NOT NULL,
    "systemKey" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "systemType" "GovernedSystemType" NOT NULL,
    "tenantId" TEXT,
    "ownerUserId" TEXT,
    "ownerTeam" TEXT NOT NULL,
    "businessPurpose" TEXT NOT NULL,
    "affectedPeopleSummary" TEXT NOT NULL,
    "decisionRole" TEXT NOT NULL,
    "actionRiskCeiling" TEXT NOT NULL,
    "prohibitedUses" JSONB NOT NULL,
    "knownLimitations" TEXT NOT NULL,
    "incidentContact" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "legacyAlgorithmId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pig_governed_systems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pig_governed_system_versions" (
    "id" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    "versionKey" TEXT NOT NULL,
    "modelOrRulesVersion" TEXT NOT NULL,
    "promptVersion" TEXT,
    "inputsJson" JSONB NOT NULL,
    "outputsJson" JSONB NOT NULL,
    "dataCategories" JSONB NOT NULL,
    "humanOversightDescription" TEXT NOT NULL,
    "fairnessTestingSummary" TEXT,
    "accessibilityTestingSummary" TEXT,
    "securityTestingSummary" TEXT,
    "privacyTestingSummary" TEXT,
    "monitoringSummary" TEXT,
    "sourceReference" TEXT,
    "publicExplanation" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "retirementDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pig_governed_system_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pig_algorithm_register_entries" (
    "id" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    "systemVersionId" TEXT,
    "legacyRegisteredAlgorithmId" TEXT,
    "publicTitle" TEXT NOT NULL,
    "publicSummary" TEXT NOT NULL,
    "doesNotDoSummary" TEXT NOT NULL,
    "aiInvolved" BOOLEAN NOT NULL,
    "ranksOrRecommends" BOOLEAN NOT NULL,
    "ownerDisplay" TEXT NOT NULL,
    "affectedPeoplePublic" TEXT NOT NULL,
    "dataCategoriesPublic" JSONB NOT NULL,
    "exclusionsPublic" TEXT NOT NULL,
    "humanReviewPublic" TEXT NOT NULL,
    "limitationsPublic" TEXT NOT NULL,
    "latestAssessmentAt" TIMESTAMP(3),
    "operatingStatus" TEXT NOT NULL,
    "challengeHowTo" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "visibility" "PublicationVisibility" NOT NULL DEFAULT 'public',
    "certificationClaimForbidden" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pig_algorithm_register_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pig_algorithmic_impact_assessments" (
    "id" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    "systemVersionId" TEXT,
    "status" "AiaStatus" NOT NULL DEFAULT 'draft',
    "assessorId" TEXT,
    "reviewerId" TEXT,
    "summary" TEXT NOT NULL,
    "rightsImpacts" JSONB NOT NULL,
    "residualRisks" JSONB NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "evidenceRefs" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pig_algorithmic_impact_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pig_rights_impact_assessments" (
    "id" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    "aiaId" TEXT,
    "summary" TEXT NOT NULL,
    "impactAreas" JSONB NOT NULL,
    "mitigations" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pig_rights_impact_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "governance_decision_records" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "subjectUserId" TEXT,
    "systemId" TEXT,
    "systemVersionId" TEXT,
    "impact" "DecisionImpact" NOT NULL,
    "status" "GovernedDecisionStatus" NOT NULL DEFAULT 'proposed',
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "decisionOwnerId" TEXT NOT NULL,
    "humanInvolved" BOOLEAN NOT NULL,
    "systemInvolved" BOOLEAN NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "materialFacts" JSONB,
    "uncertaintyNotes" TEXT,
    "notConsideredNotes" TEXT,
    "effectOnPerson" TEXT,
    "effectiveAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "correlationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "governance_decision_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pig_decision_notices" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "plainLanguage" TEXT NOT NULL,
    "easyRead" TEXT NOT NULL,
    "detailedNotice" TEXT NOT NULL,
    "machineReadable" JSONB NOT NULL,
    "printableRef" TEXT,
    "appealDeadlineAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pig_decision_notices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pig_decision_evidence_references" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "evidenceRef" TEXT NOT NULL,
    "sensitivity" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pig_decision_evidence_references_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pig_appeal_cases" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "tenantId" TEXT,
    "appellantUserId" TEXT NOT NULL,
    "advocateUserId" TEXT,
    "status" "AppealStatus" NOT NULL DEFAULT 'draft',
    "nonRetaliationAcknowledged" BOOLEAN NOT NULL,
    "serviceAccessContinued" BOOLEAN NOT NULL DEFAULT true,
    "lateSubmissionReason" TEXT,
    "submittedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pig_appeal_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pig_appeal_grounds" (
    "id" TEXT NOT NULL,
    "appealId" TEXT NOT NULL,
    "groundType" "AppealGroundType" NOT NULL,
    "narrative" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pig_appeal_grounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pig_appeal_submissions" (
    "id" TEXT NOT NULL,
    "appealId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "accessibleFormat" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pig_appeal_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pig_independent_reviews" (
    "id" TEXT NOT NULL,
    "appealId" TEXT NOT NULL,
    "reviewerUserId" TEXT NOT NULL,
    "conflictChecked" BOOLEAN NOT NULL,
    "conflictFound" BOOLEAN NOT NULL DEFAULT false,
    "assignedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pig_independent_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pig_review_findings" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "finding" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pig_review_findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pig_remedy_actions" (
    "id" TEXT NOT NULL,
    "appealId" TEXT NOT NULL,
    "actionType" "RemedyActionType" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "description" TEXT NOT NULL,
    "downstreamRefs" JSONB,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pig_remedy_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pig_oversight_bodies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bodyType" "OversightBodyType" NOT NULL,
    "tenantId" TEXT,
    "status" TEXT NOT NULL,
    "termMonths" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pig_oversight_bodies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pig_oversight_memberships" (
    "id" TEXT NOT NULL,
    "bodyId" TEXT NOT NULL,
    "userId" TEXT,
    "displayName" TEXT NOT NULL,
    "constituency" TEXT NOT NULL,
    "termStart" TIMESTAMP(3) NOT NULL,
    "termEnd" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "remunerationNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pig_oversight_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pig_community_panels" (
    "id" TEXT NOT NULL,
    "bodyId" TEXT,
    "name" TEXT NOT NULL,
    "tenantId" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pig_community_panels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pig_community_recommendations" (
    "id" TEXT NOT NULL,
    "panelId" TEXT,
    "bodyId" TEXT,
    "title" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "bindingAuthority" BOOLEAN NOT NULL DEFAULT false,
    "minorityView" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pig_community_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pig_governance_responses" (
    "id" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "responderId" TEXT,
    "responseBody" TEXT NOT NULL,
    "respondedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pig_governance_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pig_conflict_of_interest_declarations" (
    "id" TEXT NOT NULL,
    "subjectUserId" TEXT NOT NULL,
    "contextType" TEXT NOT NULL,
    "contextId" TEXT NOT NULL,
    "declaration" TEXT NOT NULL,
    "recusalRequired" BOOLEAN NOT NULL,
    "declaredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pig_conflict_of_interest_declarations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pig_public_register_publications" (
    "id" TEXT NOT NULL,
    "entryId" TEXT,
    "kind" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "supersededAt" TIMESTAMP(3),
    "visibility" "PublicationVisibility" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pig_public_register_publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pig_ai_governance_affected_parties" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "subjectUserId" TEXT,
    "noticeDecisionId" TEXT,
    "status" TEXT NOT NULL,
    "notifiedAt" TIMESTAMP(3),
    "remediatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pig_ai_governance_affected_parties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pig_governed_systems_systemKey_key" ON "pig_governed_systems"("systemKey");
CREATE INDEX "pig_governed_systems_tenantId_status_idx" ON "pig_governed_systems"("tenantId", "status");
CREATE INDEX "pig_governed_systems_systemType_status_idx" ON "pig_governed_systems"("systemType", "status");
CREATE UNIQUE INDEX "pig_governed_system_versions_systemId_versionKey_key" ON "pig_governed_system_versions"("systemId", "versionKey");
CREATE INDEX "pig_governed_system_versions_effectiveFrom_effectiveTo_idx" ON "pig_governed_system_versions"("effectiveFrom", "effectiveTo");
CREATE INDEX "pig_algorithm_register_entries_systemId_visibility_idx" ON "pig_algorithm_register_entries"("systemId", "visibility");
CREATE INDEX "pig_algorithm_register_entries_publishedAt_idx" ON "pig_algorithm_register_entries"("publishedAt");
CREATE INDEX "pig_algorithmic_impact_assessments_systemId_status_idx" ON "pig_algorithmic_impact_assessments"("systemId", "status");
CREATE INDEX "pig_algorithmic_impact_assessments_expiresAt_idx" ON "pig_algorithmic_impact_assessments"("expiresAt");
CREATE INDEX "pig_rights_impact_assessments_systemId_idx" ON "pig_rights_impact_assessments"("systemId");
CREATE INDEX "pig_rights_impact_assessments_aiaId_idx" ON "pig_rights_impact_assessments"("aiaId");
CREATE INDEX "governance_decision_records_tenantId_status_idx" ON "governance_decision_records"("tenantId", "status");
CREATE INDEX "governance_decision_records_subjectUserId_createdAt_idx" ON "governance_decision_records"("subjectUserId", "createdAt");
CREATE INDEX "governance_decision_records_systemId_impact_idx" ON "governance_decision_records"("systemId", "impact");
CREATE INDEX "governance_decision_records_correlationId_idx" ON "governance_decision_records"("correlationId");
CREATE UNIQUE INDEX "pig_decision_notices_decisionId_key" ON "pig_decision_notices"("decisionId");
CREATE INDEX "pig_decision_evidence_references_decisionId_idx" ON "pig_decision_evidence_references"("decisionId");
CREATE INDEX "pig_appeal_cases_decisionId_status_idx" ON "pig_appeal_cases"("decisionId", "status");
CREATE INDEX "pig_appeal_cases_appellantUserId_status_idx" ON "pig_appeal_cases"("appellantUserId", "status");
CREATE INDEX "pig_appeal_cases_tenantId_status_idx" ON "pig_appeal_cases"("tenantId", "status");
CREATE INDEX "pig_appeal_grounds_appealId_idx" ON "pig_appeal_grounds"("appealId");
CREATE INDEX "pig_appeal_submissions_appealId_kind_idx" ON "pig_appeal_submissions"("appealId", "kind");
CREATE INDEX "pig_independent_reviews_appealId_idx" ON "pig_independent_reviews"("appealId");
CREATE INDEX "pig_independent_reviews_reviewerUserId_idx" ON "pig_independent_reviews"("reviewerUserId");
CREATE INDEX "pig_review_findings_reviewId_idx" ON "pig_review_findings"("reviewId");
CREATE INDEX "pig_remedy_actions_appealId_status_idx" ON "pig_remedy_actions"("appealId", "status");
CREATE INDEX "pig_oversight_bodies_tenantId_status_idx" ON "pig_oversight_bodies"("tenantId", "status");
CREATE INDEX "pig_oversight_memberships_bodyId_status_idx" ON "pig_oversight_memberships"("bodyId", "status");
CREATE INDEX "pig_oversight_memberships_userId_idx" ON "pig_oversight_memberships"("userId");
CREATE INDEX "pig_community_panels_tenantId_status_idx" ON "pig_community_panels"("tenantId", "status");
CREATE INDEX "pig_community_recommendations_panelId_status_idx" ON "pig_community_recommendations"("panelId", "status");
CREATE INDEX "pig_community_recommendations_bodyId_status_idx" ON "pig_community_recommendations"("bodyId", "status");
CREATE INDEX "pig_governance_responses_recommendationId_idx" ON "pig_governance_responses"("recommendationId");
CREATE INDEX "pig_conflict_of_interest_declarations_subjectUserId_contextType_contextId_idx" ON "pig_conflict_of_interest_declarations"("subjectUserId", "contextType", "contextId");
CREATE INDEX "pig_public_register_publications_entryId_publishedAt_idx" ON "pig_public_register_publications"("entryId", "publishedAt");
CREATE INDEX "pig_public_register_publications_visibility_publishedAt_idx" ON "pig_public_register_publications"("visibility", "publishedAt");
CREATE INDEX "pig_ai_governance_affected_parties_incidentId_status_idx" ON "pig_ai_governance_affected_parties"("incidentId", "status");
CREATE INDEX "pig_ai_governance_affected_parties_subjectUserId_idx" ON "pig_ai_governance_affected_parties"("subjectUserId");

-- AddForeignKey
ALTER TABLE "pig_governed_system_versions" ADD CONSTRAINT "pig_governed_system_versions_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "pig_governed_systems"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pig_algorithm_register_entries" ADD CONSTRAINT "pig_algorithm_register_entries_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "pig_governed_systems"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pig_algorithm_register_entries" ADD CONSTRAINT "pig_algorithm_register_entries_systemVersionId_fkey" FOREIGN KEY ("systemVersionId") REFERENCES "pig_governed_system_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pig_algorithmic_impact_assessments" ADD CONSTRAINT "pig_algorithmic_impact_assessments_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "pig_governed_systems"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pig_algorithmic_impact_assessments" ADD CONSTRAINT "pig_algorithmic_impact_assessments_systemVersionId_fkey" FOREIGN KEY ("systemVersionId") REFERENCES "pig_governed_system_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pig_rights_impact_assessments" ADD CONSTRAINT "pig_rights_impact_assessments_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "pig_governed_systems"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pig_rights_impact_assessments" ADD CONSTRAINT "pig_rights_impact_assessments_aiaId_fkey" FOREIGN KEY ("aiaId") REFERENCES "pig_algorithmic_impact_assessments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "governance_decision_records" ADD CONSTRAINT "governance_decision_records_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "pig_governed_systems"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "governance_decision_records" ADD CONSTRAINT "governance_decision_records_systemVersionId_fkey" FOREIGN KEY ("systemVersionId") REFERENCES "pig_governed_system_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pig_decision_notices" ADD CONSTRAINT "pig_decision_notices_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "governance_decision_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pig_decision_evidence_references" ADD CONSTRAINT "pig_decision_evidence_references_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "governance_decision_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pig_appeal_cases" ADD CONSTRAINT "pig_appeal_cases_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "governance_decision_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pig_appeal_grounds" ADD CONSTRAINT "pig_appeal_grounds_appealId_fkey" FOREIGN KEY ("appealId") REFERENCES "pig_appeal_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pig_appeal_submissions" ADD CONSTRAINT "pig_appeal_submissions_appealId_fkey" FOREIGN KEY ("appealId") REFERENCES "pig_appeal_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pig_independent_reviews" ADD CONSTRAINT "pig_independent_reviews_appealId_fkey" FOREIGN KEY ("appealId") REFERENCES "pig_appeal_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pig_review_findings" ADD CONSTRAINT "pig_review_findings_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "pig_independent_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pig_remedy_actions" ADD CONSTRAINT "pig_remedy_actions_appealId_fkey" FOREIGN KEY ("appealId") REFERENCES "pig_appeal_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pig_oversight_memberships" ADD CONSTRAINT "pig_oversight_memberships_bodyId_fkey" FOREIGN KEY ("bodyId") REFERENCES "pig_oversight_bodies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pig_community_panels" ADD CONSTRAINT "pig_community_panels_bodyId_fkey" FOREIGN KEY ("bodyId") REFERENCES "pig_oversight_bodies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pig_community_recommendations" ADD CONSTRAINT "pig_community_recommendations_panelId_fkey" FOREIGN KEY ("panelId") REFERENCES "pig_community_panels"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pig_community_recommendations" ADD CONSTRAINT "pig_community_recommendations_bodyId_fkey" FOREIGN KEY ("bodyId") REFERENCES "pig_oversight_bodies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pig_governance_responses" ADD CONSTRAINT "pig_governance_responses_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "pig_community_recommendations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pig_public_register_publications" ADD CONSTRAINT "pig_public_register_publications_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "pig_algorithm_register_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pig_ai_governance_affected_parties" ADD CONSTRAINT "pig_ai_governance_affected_parties_noticeDecisionId_fkey" FOREIGN KEY ("noticeDecisionId") REFERENCES "governance_decision_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;
