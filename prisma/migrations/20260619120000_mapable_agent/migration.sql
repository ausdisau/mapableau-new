-- MapAble Agent: sessions, messages, human review, document chunks (pgvector), tool logs

CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "AgentSessionStatus" AS ENUM ('active', 'archived', 'closed');
CREATE TYPE "AgentMessageRole" AS ENUM ('user', 'assistant', 'system', 'tool');
CREATE TYPE "HumanReviewCategory" AS ENUM ('privacy', 'safeguarding', 'payment', 'provider_selection', 'funding', 'low_confidence');
CREATE TYPE "HumanReviewPriority" AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE "HumanReviewStatus" AS ENUM ('pending', 'in_progress', 'approved', 'rejected', 'cancelled');

-- AlterEnum AgentRunType
ALTER TYPE "AgentRunType" ADD VALUE IF NOT EXISTS 'mapable_agent';
ALTER TYPE "AgentRunType" ADD VALUE IF NOT EXISTS 'plan_parser';
ALTER TYPE "AgentRunType" ADD VALUE IF NOT EXISTS 'invoice_classifier';
ALTER TYPE "AgentRunType" ADD VALUE IF NOT EXISTS 'job_matcher';

-- CreateTable agent_sessions
CREATE TABLE "agent_sessions" (
    "id" TEXT NOT NULL,
    "participantId" TEXT,
    "actorUserId" TEXT,
    "title" TEXT,
    "status" "AgentSessionStatus" NOT NULL DEFAULT 'active',
    "modelProvider" TEXT NOT NULL DEFAULT 'ollama',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "agent_sessions_participantId_idx" ON "agent_sessions"("participantId");
CREATE INDEX "agent_sessions_actorUserId_idx" ON "agent_sessions"("actorUserId");
CREATE INDEX "agent_sessions_status_idx" ON "agent_sessions"("status");

-- CreateTable agent_messages
CREATE TABLE "agent_messages" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" "AgentMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "reasoningSummary" TEXT,
    "toolCalls" JSONB,
    "toolResults" JSONB,
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "agent_messages_sessionId_createdAt_idx" ON "agent_messages"("sessionId", "createdAt");

ALTER TABLE "agent_messages" ADD CONSTRAINT "agent_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "agent_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable agent_runs
ALTER TABLE "agent_runs" ADD COLUMN IF NOT EXISTS "sessionId" TEXT;
CREATE INDEX IF NOT EXISTS "agent_runs_sessionId_idx" ON "agent_runs"("sessionId");
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "agent_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable human_review_tasks
CREATE TABLE "human_review_tasks" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "agentRunId" TEXT,
    "participantId" TEXT,
    "category" "HumanReviewCategory" NOT NULL,
    "priority" "HumanReviewPriority" NOT NULL DEFAULT 'normal',
    "status" "HumanReviewStatus" NOT NULL DEFAULT 'pending',
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "context" JSONB NOT NULL DEFAULT '{}',
    "assignedToId" TEXT,
    "resolvedById" TEXT,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "human_review_tasks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "human_review_tasks_status_priority_idx" ON "human_review_tasks"("status", "priority");
CREATE INDEX "human_review_tasks_participantId_idx" ON "human_review_tasks"("participantId");
CREATE INDEX "human_review_tasks_sessionId_idx" ON "human_review_tasks"("sessionId");

ALTER TABLE "human_review_tasks" ADD CONSTRAINT "human_review_tasks_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "agent_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "human_review_tasks" ADD CONSTRAINT "human_review_tasks_agentRunId_fkey" FOREIGN KEY ("agentRunId") REFERENCES "agent_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable document_chunks
CREATE TABLE "document_chunks" (
    "id" TEXT NOT NULL,
    "documentId" TEXT,
    "participantId" TEXT,
    "organisationId" TEXT,
    "sourceType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1536),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_chunks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "document_chunks_documentId_idx" ON "document_chunks"("documentId");
CREATE INDEX "document_chunks_participantId_idx" ON "document_chunks"("participantId");
CREATE INDEX "document_chunks_sourceType_idx" ON "document_chunks"("sourceType");

-- CreateTable tool_execution_logs
CREATE TABLE "tool_execution_logs" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "agentRunId" TEXT,
    "toolName" TEXT NOT NULL,
    "inputHash" TEXT NOT NULL,
    "outputSummary" JSONB,
    "confidence" DOUBLE PRECISION,
    "sensitive" BOOLEAN NOT NULL DEFAULT false,
    "auditEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tool_execution_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "tool_execution_logs_sessionId_idx" ON "tool_execution_logs"("sessionId");
CREATE INDEX "tool_execution_logs_toolName_idx" ON "tool_execution_logs"("toolName");

ALTER TABLE "tool_execution_logs" ADD CONSTRAINT "tool_execution_logs_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "agent_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tool_execution_logs" ADD CONSTRAINT "tool_execution_logs_agentRunId_fkey" FOREIGN KEY ("agentRunId") REFERENCES "agent_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable agent_user_settings
CREATE TABLE "agent_user_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "highContrastMode" BOOLEAN NOT NULL DEFAULT false,
    "largeTouchTargets" BOOLEAN NOT NULL DEFAULT false,
    "reducedMotion" BOOLEAN NOT NULL DEFAULT false,
    "showReasoningSummary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_user_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "agent_user_settings_userId_key" ON "agent_user_settings"("userId");
