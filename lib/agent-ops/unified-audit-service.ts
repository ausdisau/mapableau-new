import type { AgentRunType, AgentRunStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type UnifiedAgentAuditEntry = {
  id: string;
  agentType: AgentRunType;
  status: AgentRunStatus;
  createdAt: Date;
  humanReviewRequired: boolean;
  participantId: string | null;
  careRequestId: string | null;
  matchRunId: string | null;
  source: "agent_run";
  summary: string;
};

/**
 * Unified read model for governed AI audit — Ask, care transformer, cases, matching.
 */
export async function listUnifiedAgentAudit(filters?: {
  status?: AgentRunStatus;
  agentType?: AgentRunType;
  participantId?: string;
  requiresReview?: boolean;
  limit?: number;
}) {
  const runs = await prisma.agentRun.findMany({
    where: {
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.agentType ? { agentType: filters.agentType } : {}),
      ...(filters?.participantId
        ? { participantId: filters.participantId }
        : {}),
      ...(filters?.requiresReview
        ? { humanReviewRequired: true, status: { in: ["started", "completed"] } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: filters?.limit ?? 50,
  });

  return runs.map(
    (run): UnifiedAgentAuditEntry => ({
      id: run.id,
      agentType: run.agentType,
      status: run.status,
      createdAt: run.createdAt,
      humanReviewRequired: run.humanReviewRequired,
      participantId: run.participantId,
      careRequestId: run.careRequestId,
      matchRunId: run.matchRunId,
      source: "agent_run",
      summary: formatAgentRunSummary(run),
    })
  );
}

function formatAgentRunSummary(run: {
  agentType: AgentRunType;
  inputSummary: unknown;
  outputSummary: unknown;
  toolsCalled: string[];
}) {
  const tools =
    run.toolsCalled.length > 0 ? ` tools: ${run.toolsCalled.join(", ")}` : "";
  return `${run.agentType}${tools}`;
}

export async function countPendingAgentReviews() {
  return prisma.agentRun.count({
    where: {
      humanReviewRequired: true,
      status: { in: ["started", "completed"] },
    },
  });
}
