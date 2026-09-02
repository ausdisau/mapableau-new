-- Co-design and disability-led research governance (Prompt 01)

CREATE TYPE "CoDesignProgrammeStatus" AS ENUM ('draft', 'recruiting', 'active', 'paused', 'completed', 'archived');
CREATE TYPE "ResearchParticipationRole" AS ENUM ('co_investigator', 'paid_researcher', 'field_validator', 'design_reviewer', 'governance_member', 'research_participant');
CREATE TYPE "ResearchConsentPurpose" AS ENUM ('data_collection', 'interviews', 'usability_testing', 'field_validation', 'governance_participation', 'payment_processing');
CREATE TYPE "ResearchConsentRecordStatus" AS ENUM ('pending', 'granted', 'declined', 'withdrawn');
CREATE TYPE "ResearchContributionStatus" AS ENUM ('draft', 'submitted', 'accepted', 'rejected');
CREATE TYPE "ContributionPaymentStatus" AS ENUM ('pending', 'approved', 'paid', 'cancelled');
CREATE TYPE "ResearchDecisionStatus" AS ENUM ('draft', 'published', 'superseded');
CREATE TYPE "CommunityReviewStatus" AS ENUM ('open', 'in_progress', 'closed');
CREATE TYPE "AccessibilityFindingSeverity" AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE "AccessibilityFindingStatus" AS ENUM ('open', 'triaged', 'in_progress', 'resolved', 'wont_fix');

CREATE TABLE "co_design_programmes" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "plainLanguageSummary" TEXT,
    "status" "CoDesignProgrammeStatus" NOT NULL DEFAULT 'draft',
    "researchProjectId" TEXT,
    "organisationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "co_design_programmes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "co_design_participants" (
    "id" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ResearchParticipationRole" NOT NULL,
    "functionalAccessNotes" TEXT,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "withdrawnAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "co_design_participants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "research_consent_records" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "programmeId" TEXT,
    "projectId" TEXT,
    "purpose" "ResearchConsentPurpose" NOT NULL,
    "status" "ResearchConsentRecordStatus" NOT NULL DEFAULT 'pending',
    "plainLanguageSummary" TEXT,
    "grantedAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "research_consent_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "research_contributions" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "projectId" TEXT,
    "status" "ResearchContributionStatus" NOT NULL DEFAULT 'draft',
    "contributionType" TEXT NOT NULL,
    "structuredPayload" JSONB,
    "plainLanguageNotes" TEXT,
    "observedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "research_contributions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "contribution_payments" (
    "id" TEXT NOT NULL,
    "contributionId" TEXT,
    "participantId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AUD',
    "status" "ContributionPaymentStatus" NOT NULL DEFAULT 'pending',
    "reference" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "contribution_payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "research_decisions" (
    "id" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "projectId" TEXT,
    "title" TEXT NOT NULL,
    "status" "ResearchDecisionStatus" NOT NULL DEFAULT 'draft',
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "research_decisions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "decision_rationales" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "plainLanguageSummary" TEXT NOT NULL,
    "technicalNotes" TEXT,
    "participantVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "decision_rationales_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "community_reviews" (
    "id" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "projectId" TEXT,
    "title" TEXT NOT NULL,
    "status" "CommunityReviewStatus" NOT NULL DEFAULT 'open',
    "featureScope" TEXT,
    "plainLanguageBrief" TEXT,
    "opensAt" TIMESTAMP(3),
    "closesAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "community_reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "accessibility_findings" (
    "id" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "projectId" TEXT,
    "reviewId" TEXT,
    "contributionId" TEXT,
    "severity" "AccessibilityFindingSeverity" NOT NULL,
    "status" "AccessibilityFindingStatus" NOT NULL DEFAULT 'open',
    "title" TEXT NOT NULL,
    "plainLanguageDescription" TEXT NOT NULL,
    "functionalAccessTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "accessibility_findings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "co_design_participants_programmeId_userId_key" ON "co_design_participants"("programmeId", "userId");
CREATE INDEX "co_design_participants_userId_idx" ON "co_design_participants"("userId");
CREATE INDEX "co_design_participants_programmeId_role_idx" ON "co_design_participants"("programmeId", "role");

CREATE UNIQUE INDEX "research_consent_records_participantId_programmeId_purpose_key" ON "research_consent_records"("participantId", "programmeId", "purpose");
CREATE INDEX "research_consent_records_participantId_status_idx" ON "research_consent_records"("participantId", "status");
CREATE INDEX "research_consent_records_projectId_idx" ON "research_consent_records"("projectId");

CREATE INDEX "co_design_programmes_status_idx" ON "co_design_programmes"("status");
CREATE INDEX "co_design_programmes_researchProjectId_idx" ON "co_design_programmes"("researchProjectId");
CREATE INDEX "co_design_programmes_organisationId_idx" ON "co_design_programmes"("organisationId");

CREATE INDEX "research_contributions_programmeId_status_idx" ON "research_contributions"("programmeId", "status");
CREATE INDEX "research_contributions_participantId_idx" ON "research_contributions"("participantId");

CREATE INDEX "contribution_payments_participantId_status_idx" ON "contribution_payments"("participantId", "status");
CREATE INDEX "contribution_payments_contributionId_idx" ON "contribution_payments"("contributionId");

CREATE INDEX "research_decisions_programmeId_status_idx" ON "research_decisions"("programmeId", "status");
CREATE INDEX "decision_rationales_decisionId_idx" ON "decision_rationales"("decisionId");

CREATE INDEX "community_reviews_programmeId_status_idx" ON "community_reviews"("programmeId", "status");
CREATE INDEX "accessibility_findings_programmeId_status_idx" ON "accessibility_findings"("programmeId", "status");
CREATE INDEX "accessibility_findings_reviewId_idx" ON "accessibility_findings"("reviewId");

ALTER TABLE "co_design_programmes" ADD CONSTRAINT "co_design_programmes_researchProjectId_fkey" FOREIGN KEY ("researchProjectId") REFERENCES "research_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "co_design_programmes" ADD CONSTRAINT "co_design_programmes_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "co_design_participants" ADD CONSTRAINT "co_design_participants_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "co_design_programmes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "co_design_participants" ADD CONSTRAINT "co_design_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "research_consent_records" ADD CONSTRAINT "research_consent_records_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "research_consent_records" ADD CONSTRAINT "research_consent_records_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "co_design_programmes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "research_consent_records" ADD CONSTRAINT "research_consent_records_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "research_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "research_contributions" ADD CONSTRAINT "research_contributions_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "research_contributions" ADD CONSTRAINT "research_contributions_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "co_design_programmes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "research_contributions" ADD CONSTRAINT "research_contributions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "research_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "contribution_payments" ADD CONSTRAINT "contribution_payments_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "research_contributions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "contribution_payments" ADD CONSTRAINT "contribution_payments_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "research_decisions" ADD CONSTRAINT "research_decisions_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "co_design_programmes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "research_decisions" ADD CONSTRAINT "research_decisions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "research_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "decision_rationales" ADD CONSTRAINT "decision_rationales_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "research_decisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "community_reviews" ADD CONSTRAINT "community_reviews_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "co_design_programmes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community_reviews" ADD CONSTRAINT "community_reviews_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "research_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "accessibility_findings" ADD CONSTRAINT "accessibility_findings_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "co_design_programmes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "accessibility_findings" ADD CONSTRAINT "accessibility_findings_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "research_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "accessibility_findings" ADD CONSTRAINT "accessibility_findings_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "community_reviews"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "accessibility_findings" ADD CONSTRAINT "accessibility_findings_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "research_contributions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
