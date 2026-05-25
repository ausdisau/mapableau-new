import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

import type { AgentContext, AgentRunResult, MapAbleAgentId } from "./agent-types";
import { redactText } from "./guardrails/pii-redaction";

export async function createAgentRun(params: {
  agentId: MapAbleAgentId;
  context: AgentContext;
  conversationId?: string;
  modelProvider: string;
  modelId?: string;
}) {
  return prisma.agentRun.create({
    data: {
      agentId: params.agentId,
      userId: params.context.userId,
      profileId: params.context.profileId,
      conversationId: params.conversationId,
      modelProvider: params.modelProvider,
      modelId: params.modelId,
      status: "running",
    },
  });
}

export async function completeAgentRun(
  runId: string,
  result: AgentRunResult,
  latencyMs: number
) {
  await prisma.agentRun.update({
    where: { id: runId },
    data: {
      status: result.actionStatus === "blocked" ? "blocked" : "completed",
      riskLevel: result.toolCalls.some((t) => t.riskLevel === "critical")
        ? "critical"
        : result.toolCalls.some((t) => t.riskLevel === "high")
          ? "high"
          : "low",
      latencyMs,
      completedAt: new Date(),
    },
  });

  for (const tc of result.toolCalls) {
    await prisma.agentToolCall.create({
      data: {
        agentRunId: runId,
        toolName: tc.toolName,
        status:
          tc.status === "blocked"
            ? "blocked"
            : tc.riskLevel === "high" || tc.riskLevel === "critical"
              ? "requires_confirmation"
              : "completed",
        riskLevel: tc.riskLevel,
        outputSummary: tc.outputSummary,
        blockedReason: tc.blockedReason,
      },
    });
  }
}

export async function logAgentRunStart(
  context: AgentContext,
  agentId: MapAbleAgentId,
  runId: string
) {
  await createAuditEvent({
    actorUserId: context.userId,
    action: "agent.run.started",
    entityType: "AgentRun",
    entityId: runId,
    participantId: context.participantId,
    metadata: { agentId },
  });
}

export async function persistAgentMessage(params: {
  conversationId: string;
  role: string;
  content: string;
}) {
  await prisma.agentMessage.create({
    data: {
      conversationId: params.conversationId,
      role: params.role,
      content: params.content,
      redactedContent: redactText(params.content),
    },
  });
}
