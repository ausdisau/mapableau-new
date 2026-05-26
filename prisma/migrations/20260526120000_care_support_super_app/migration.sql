-- Care and support super-app: assessments, referrals, coordination

-- CreateEnum
CREATE TYPE "SupportNeedsAssessmentStatus" AS ENUM ('draft', 'submitted', 'reviewed');
CREATE TYPE "SupportNeedsAssessmentSource" AS ENUM ('participant_self', 'coordinator', 'import_placeholder');
CREATE TYPE "SupportReferralType" AS ENUM ('internal_care', 'internal_transport', 'internal_employment', 'internal_provider', 'external');
CREATE TYPE "SupportReferralStatus" AS ENUM ('draft', 'submitted', 'triaged', 'accepted', 'declined', 'completed', 'cancelled');
CREATE TYPE "SupportReferralPriority" AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE "CoordinationCaseStatus" AS ENUM ('open', 'monitoring', 'closed');

-- AlterEnum CoordinatorTaskType
ALTER TYPE "CoordinatorTaskType" ADD VALUE IF NOT EXISTS 'review_assessment';
ALTER TYPE "CoordinatorTaskType" ADD VALUE IF NOT EXISTS 'triage_referral';
ALTER TYPE "CoordinatorTaskType" ADD VALUE IF NOT EXISTS 'coordinate_services';

-- CreateTable
CREATE TABLE "support_needs_assessments" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "status" "SupportNeedsAssessmentStatus" NOT NULL DEFAULT 'draft',
    "source" "SupportNeedsAssessmentSource" NOT NULL DEFAULT 'participant_self',
    "sectionsJson" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "submittedAt" TIMESTAMP(3),
    "reviewedByCoordinatorId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_needs_assessments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "support_referrals" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "assessmentId" TEXT,
    "referralType" "SupportReferralType" NOT NULL,
    "status" "SupportReferralStatus" NOT NULL DEFAULT 'draft',
    "priority" "SupportReferralPriority" NOT NULL DEFAULT 'normal',
    "summary" TEXT NOT NULL,
    "destinationJson" JSONB NOT NULL DEFAULT '{}',
    "careRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_referrals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "coordination_cases" (
    "id" TEXT NOT NULL,
    "relationshipId" TEXT NOT NULL,
    "status" "CoordinationCaseStatus" NOT NULL DEFAULT 'open',
    "openReferralCount" INTEGER NOT NULL DEFAULT 0,
    "latestAssessmentId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coordination_cases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "support_needs_assessments_participantId_status_idx" ON "support_needs_assessments"("participantId", "status");
CREATE INDEX "support_referrals_participantId_status_idx" ON "support_referrals"("participantId", "status");
CREATE INDEX "support_referrals_referralType_status_idx" ON "support_referrals"("referralType", "status");
CREATE UNIQUE INDEX "coordination_cases_relationshipId_key" ON "coordination_cases"("relationshipId");

-- AddForeignKey
ALTER TABLE "support_needs_assessments" ADD CONSTRAINT "support_needs_assessments_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_needs_assessments" ADD CONSTRAINT "support_needs_assessments_reviewedByCoordinatorId_fkey" FOREIGN KEY ("reviewedByCoordinatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "support_referrals" ADD CONSTRAINT "support_referrals_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_referrals" ADD CONSTRAINT "support_referrals_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_referrals" ADD CONSTRAINT "support_referrals_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "support_needs_assessments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "support_referrals" ADD CONSTRAINT "support_referrals_careRequestId_fkey" FOREIGN KEY ("careRequestId") REFERENCES "care_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "coordination_cases" ADD CONSTRAINT "coordination_cases_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "SupportCoordinatorRelationship"("id") ON DELETE CASCADE ON UPDATE CASCADE;
