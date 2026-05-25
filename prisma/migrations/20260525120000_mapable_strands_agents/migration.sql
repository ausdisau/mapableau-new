-- MapAble Strands Agents persistence

CREATE TYPE "AgentConversationStatus" AS ENUM ('active', 'archived');
CREATE TYPE "AgentRunStatus" AS ENUM ('running', 'completed', 'failed', 'blocked', 'cancelled');
CREATE TYPE "AgentToolCallStatus" AS ENUM ('pending', 'completed', 'blocked', 'requires_confirmation');
CREATE TYPE "AgentApprovalStatus" AS ENUM ('pending', 'approved', 'rejected', 'expired');

CREATE TABLE "AgentConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "title" TEXT,
    "status" "AgentConversationStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AgentConversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgentMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "redactedContent" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgentMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgentRun" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT,
    "agentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "status" "AgentRunStatus" NOT NULL DEFAULT 'running',
    "riskLevel" TEXT NOT NULL DEFAULT 'low',
    "modelProvider" TEXT,
    "modelId" TEXT,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "latencyMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "AgentRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgentToolCall" (
    "id" TEXT NOT NULL,
    "agentRunId" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "inputHash" TEXT,
    "outputSummary" TEXT,
    "status" "AgentToolCallStatus" NOT NULL DEFAULT 'pending',
    "riskLevel" TEXT NOT NULL DEFAULT 'low',
    "blockedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgentToolCall_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgentApprovalRequest" (
    "id" TEXT NOT NULL,
    "agentRunId" TEXT NOT NULL,
    "requestedAction" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "status" "AgentApprovalStatus" NOT NULL DEFAULT 'pending',
    "requestedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgentApprovalRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgentSafetyEvent" (
    "id" TEXT NOT NULL,
    "agentRunId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgentSafetyEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgentEvalRun" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "evalSuite" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "scoreJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgentEvalRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AgentFeedback" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT,
    "agentRunId" TEXT,
    "userId" TEXT NOT NULL,
    "rating" INTEGER,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgentFeedback_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AgentConversation_userId_updatedAt_idx" ON "AgentConversation"("userId", "updatedAt");
CREATE INDEX "AgentMessage_conversationId_createdAt_idx" ON "AgentMessage"("conversationId", "createdAt");
CREATE INDEX "AgentRun_userId_createdAt_idx" ON "AgentRun"("userId", "createdAt");
CREATE INDEX "AgentRun_agentId_status_idx" ON "AgentRun"("agentId", "status");
CREATE INDEX "AgentToolCall_agentRunId_idx" ON "AgentToolCall"("agentRunId");
CREATE INDEX "AgentToolCall_toolName_idx" ON "AgentToolCall"("toolName");
CREATE INDEX "AgentApprovalRequest_agentRunId_status_idx" ON "AgentApprovalRequest"("agentRunId", "status");
CREATE INDEX "AgentSafetyEvent_agentRunId_createdAt_idx" ON "AgentSafetyEvent"("agentRunId", "createdAt");
CREATE INDEX "AgentEvalRun_agentId_evalSuite_idx" ON "AgentEvalRun"("agentId", "evalSuite");
CREATE INDEX "AgentFeedback_agentRunId_idx" ON "AgentFeedback"("agentRunId");

ALTER TABLE "AgentConversation" ADD CONSTRAINT "AgentConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgentMessage" ADD CONSTRAINT "AgentMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AgentConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgentRun" ADD CONSTRAINT "AgentRun_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AgentConversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgentRun" ADD CONSTRAINT "AgentRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgentToolCall" ADD CONSTRAINT "AgentToolCall_agentRunId_fkey" FOREIGN KEY ("agentRunId") REFERENCES "AgentRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgentApprovalRequest" ADD CONSTRAINT "AgentApprovalRequest_agentRunId_fkey" FOREIGN KEY ("agentRunId") REFERENCES "AgentRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgentApprovalRequest" ADD CONSTRAINT "AgentApprovalRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AgentApprovalRequest" ADD CONSTRAINT "AgentApprovalRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgentSafetyEvent" ADD CONSTRAINT "AgentSafetyEvent_agentRunId_fkey" FOREIGN KEY ("agentRunId") REFERENCES "AgentRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AgentFeedback" ADD CONSTRAINT "AgentFeedback_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AgentConversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgentFeedback" ADD CONSTRAINT "AgentFeedback_agentRunId_fkey" FOREIGN KEY ("agentRunId") REFERENCES "AgentRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AgentFeedback" ADD CONSTRAINT "AgentFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
