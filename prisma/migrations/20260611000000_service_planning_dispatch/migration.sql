-- Care allocation HITL + extended dispatch queue types

-- CreateEnum
CREATE TYPE "CareAllocationTrigger" AS ENUM ('booking_accepted', 'manual', 'scheduled');
CREATE TYPE "CareAllocationRunStatus" AS ENUM ('pending', 'running', 'completed', 'failed');
CREATE TYPE "CareAllocationProposalStatus" AS ENUM ('generated', 'recommended', 'auto_eligible', 'review_required', 'approved', 'rejected', 'executed', 'blocked');
CREATE TYPE "CareAllocationAutonomyTier" AS ENUM ('recommend_only', 'conditional_auto', 'org_default');
CREATE TYPE "CareAllocationDecisionType" AS ENUM ('approved', 'rejected', 'auto_executed', 'override');

ALTER TYPE "SmartContractType" ADD VALUE IF NOT EXISTS 'care_allocation_gate';

ALTER TYPE "DispatchQueueType" ADD VALUE IF NOT EXISTS 'care_allocation';
ALTER TYPE "DispatchQueueType" ADD VALUE IF NOT EXISTS 'transport_plan_review';
ALTER TYPE "DispatchQueueType" ADD VALUE IF NOT EXISTS 'transport_dispatch';
ALTER TYPE "DispatchQueueType" ADD VALUE IF NOT EXISTS 'transport_optimisation_review';

CREATE TABLE "care_allocation_runs" (
    "id" TEXT NOT NULL,
    "careBookingId" TEXT NOT NULL,
    "careRequestId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "trigger" "CareAllocationTrigger" NOT NULL,
    "status" "CareAllocationRunStatus" NOT NULL DEFAULT 'pending',
    "autonomyTier" "CareAllocationAutonomyTier" NOT NULL DEFAULT 'recommend_only',
    "matchRunId" TEXT,
    "aiMatchRunId" TEXT,
    "requestedById" TEXT NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "care_allocation_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "care_allocation_proposals" (
    "id" TEXT NOT NULL,
    "allocationRunId" TEXT NOT NULL,
    "workerProfileId" TEXT NOT NULL,
    "matchCandidateId" TEXT,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "combinedScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gateResult" TEXT NOT NULL DEFAULT 'review_required',
    "gateSummary" JSONB NOT NULL DEFAULT '[]',
    "status" "CareAllocationProposalStatus" NOT NULL DEFAULT 'generated',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "care_allocation_proposals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "care_allocation_decisions" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "decidedById" TEXT,
    "decision" "CareAllocationDecisionType" NOT NULL,
    "autonomyTier" "CareAllocationAutonomyTier" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "care_allocation_decisions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "care_allocation_runs_careBookingId_createdAt_idx" ON "care_allocation_runs"("careBookingId", "createdAt");
CREATE INDEX "care_allocation_runs_organisationId_status_idx" ON "care_allocation_runs"("organisationId", "status");
CREATE INDEX "care_allocation_proposals_allocationRunId_status_idx" ON "care_allocation_proposals"("allocationRunId", "status");
CREATE INDEX "care_allocation_proposals_workerProfileId_idx" ON "care_allocation_proposals"("workerProfileId");
CREATE INDEX "care_allocation_decisions_proposalId_createdAt_idx" ON "care_allocation_decisions"("proposalId", "createdAt");

ALTER TABLE "care_allocation_runs" ADD CONSTRAINT "care_allocation_runs_careBookingId_fkey" FOREIGN KEY ("careBookingId") REFERENCES "care_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "care_allocation_runs" ADD CONSTRAINT "care_allocation_runs_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "care_allocation_runs" ADD CONSTRAINT "care_allocation_runs_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "care_allocation_proposals" ADD CONSTRAINT "care_allocation_proposals_allocationRunId_fkey" FOREIGN KEY ("allocationRunId") REFERENCES "care_allocation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "care_allocation_proposals" ADD CONSTRAINT "care_allocation_proposals_workerProfileId_fkey" FOREIGN KEY ("workerProfileId") REFERENCES "WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "care_allocation_decisions" ADD CONSTRAINT "care_allocation_decisions_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "care_allocation_proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "care_allocation_decisions" ADD CONSTRAINT "care_allocation_decisions_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
