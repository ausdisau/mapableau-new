-- MapAble Coordinate module tables and enums

CREATE TYPE "CoordinatePlanStatus" AS ENUM ('draft', 'active', 'archived');
CREATE TYPE "CoordinateGoalStatus" AS ENUM ('proposed', 'confirmed', 'archived');
CREATE TYPE "CoordinateActionStatus" AS ENUM ('draft', 'proposed', 'approved', 'archived');
CREATE TYPE "CoordinateShortlistStatus" AS ENUM ('suggested', 'approved', 'rejected');
CREATE TYPE "CoordinateReviewTaskType" AS ENUM ('safeguarding', 'privacy', 'pricing', 'conflict', 'low_confidence', 'general');
CREATE TYPE "CoordinateReviewTaskStatus" AS ENUM ('open', 'in_progress', 'approved', 'rejected', 'escalated');
CREATE TYPE "CoordinateCommunicationChannel" AS ENUM ('email', 'sms', 'in_app');
CREATE TYPE "CoordinateCommunicationDraftStatus" AS ENUM ('draft', 'pending_approval', 'approved', 'sent', 'rejected');
CREATE TYPE "CoordinateRiskSeverity" AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TABLE "coordinate_ndis_plans" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "planStart" TIMESTAMP(3),
    "planEnd" TIMESTAMP(3),
    "status" "CoordinatePlanStatus" NOT NULL DEFAULT 'draft',
    "sourceDocumentId" TEXT,
    "summaryJson" JSONB NOT NULL DEFAULT '{}',
    "aiConfidence" DOUBLE PRECISION,
    "aiReason" TEXT,
    "requiresReview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coordinate_ndis_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "coordinate_plan_goals" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" "CoordinateGoalStatus" NOT NULL DEFAULT 'proposed',
    "sourceSpan" TEXT,
    "confidence" DOUBLE PRECISION,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coordinate_plan_goals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "coordinate_budget_categories" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "supportCategory" TEXT NOT NULL,
    "allocatedCents" INTEGER NOT NULL DEFAULT 0,
    "spentCents" INTEGER NOT NULL DEFAULT 0,
    "committedCents" INTEGER NOT NULL DEFAULT 0,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coordinate_budget_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "coordinate_support_needs" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "needType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "linkedGoalIds" JSONB NOT NULL DEFAULT '[]',
    "urgency" TEXT NOT NULL DEFAULT 'medium',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coordinate_support_needs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "coordinate_support_actions" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "goalId" TEXT,
    "title" TEXT NOT NULL,
    "stepsJson" JSONB NOT NULL DEFAULT '[]',
    "status" "CoordinateActionStatus" NOT NULL DEFAULT 'draft',
    "ownerRole" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coordinate_support_actions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "coordinate_provider_shortlist_items" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "ndisProviderId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "matchScore" DOUBLE PRECISION,
    "matchReason" TEXT,
    "conflictFlagsJson" JSONB NOT NULL DEFAULT '[]',
    "status" "CoordinateShortlistStatus" NOT NULL DEFAULT 'suggested',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coordinate_provider_shortlist_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "coordinate_risk_flags" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "planId" TEXT,
    "code" TEXT NOT NULL,
    "severity" "CoordinateRiskSeverity" NOT NULL DEFAULT 'medium',
    "summary" TEXT NOT NULL,
    "reason" TEXT,
    "confidence" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coordinate_risk_flags_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "coordinate_human_review_tasks" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "taskType" "CoordinateReviewTaskType" NOT NULL,
    "status" "CoordinateReviewTaskStatus" NOT NULL DEFAULT 'open',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL DEFAULT '{}',
    "sourceEntityType" TEXT,
    "sourceEntityId" TEXT,
    "confidence" DOUBLE PRECISION,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coordinate_human_review_tasks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "coordinate_communication_drafts" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "channel" "CoordinateCommunicationChannel" NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "plainLanguageBody" TEXT,
    "status" "CoordinateCommunicationDraftStatus" NOT NULL DEFAULT 'draft',
    "confidence" DOUBLE PRECISION,
    "reason" TEXT,
    "reviewTaskId" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coordinate_communication_drafts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "coordinate_ndis_plans_participantId_status_idx" ON "coordinate_ndis_plans"("participantId", "status");
CREATE INDEX "coordinate_plan_goals_planId_idx" ON "coordinate_plan_goals"("planId");
CREATE INDEX "coordinate_budget_categories_planId_idx" ON "coordinate_budget_categories"("planId");
CREATE INDEX "coordinate_support_needs_planId_idx" ON "coordinate_support_needs"("planId");
CREATE INDEX "coordinate_support_actions_planId_idx" ON "coordinate_support_actions"("planId");
CREATE INDEX "coordinate_provider_shortlist_items_planId_idx" ON "coordinate_provider_shortlist_items"("planId");
CREATE INDEX "coordinate_risk_flags_participantId_active_idx" ON "coordinate_risk_flags"("participantId", "active");
CREATE INDEX "coordinate_human_review_tasks_participantId_status_idx" ON "coordinate_human_review_tasks"("participantId", "status");
CREATE INDEX "coordinate_human_review_tasks_assigneeId_status_idx" ON "coordinate_human_review_tasks"("assigneeId", "status");
CREATE INDEX "coordinate_communication_drafts_participantId_status_idx" ON "coordinate_communication_drafts"("participantId", "status");

ALTER TABLE "coordinate_ndis_plans" ADD CONSTRAINT "coordinate_ndis_plans_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "coordinate_ndis_plans" ADD CONSTRAINT "coordinate_ndis_plans_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "coordinate_plan_goals" ADD CONSTRAINT "coordinate_plan_goals_planId_fkey" FOREIGN KEY ("planId") REFERENCES "coordinate_ndis_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "coordinate_budget_categories" ADD CONSTRAINT "coordinate_budget_categories_planId_fkey" FOREIGN KEY ("planId") REFERENCES "coordinate_ndis_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "coordinate_support_needs" ADD CONSTRAINT "coordinate_support_needs_planId_fkey" FOREIGN KEY ("planId") REFERENCES "coordinate_ndis_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "coordinate_support_actions" ADD CONSTRAINT "coordinate_support_actions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "coordinate_ndis_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "coordinate_support_actions" ADD CONSTRAINT "coordinate_support_actions_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "coordinate_plan_goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "coordinate_provider_shortlist_items" ADD CONSTRAINT "coordinate_provider_shortlist_items_planId_fkey" FOREIGN KEY ("planId") REFERENCES "coordinate_ndis_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "coordinate_risk_flags" ADD CONSTRAINT "coordinate_risk_flags_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "coordinate_risk_flags" ADD CONSTRAINT "coordinate_risk_flags_planId_fkey" FOREIGN KEY ("planId") REFERENCES "coordinate_ndis_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "coordinate_human_review_tasks" ADD CONSTRAINT "coordinate_human_review_tasks_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "coordinate_human_review_tasks" ADD CONSTRAINT "coordinate_human_review_tasks_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "coordinate_communication_drafts" ADD CONSTRAINT "coordinate_communication_drafts_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "coordinate_communication_drafts" ADD CONSTRAINT "coordinate_communication_drafts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "coordinate_communication_drafts" ADD CONSTRAINT "coordinate_communication_drafts_reviewTaskId_fkey" FOREIGN KEY ("reviewTaskId") REFERENCES "coordinate_human_review_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "coordinate_communication_drafts" ADD CONSTRAINT "coordinate_communication_drafts_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
