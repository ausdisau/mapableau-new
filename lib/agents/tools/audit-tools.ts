import { tool } from "@strands-agents/sdk";
import { z } from "zod";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

import { getMapableState } from "./tool-context";

export const logAgentEvent = tool({
  name: "log_agent_event",
  description: "Log an agent lifecycle event to audit trail.",
  inputSchema: z.object({
    action: z.string().min(1),
    summary: z.string().max(200),
  }),
  callback: async (input, context) => {
    const state = getMapableState(context);
    await createAuditEvent({
      actorUserId: state.context.userId,
      action: input.action,
      entityType: "AgentRun",
      entityId: state.runId,
      participantId: state.context.participantId,
      metadata: { summary: input.summary, agentId: state.agentId },
    });
    return { logged: true };
  },
});

export const logToolAccess = tool({
  name: "log_tool_access",
  description: "Log tool access for audit (redacted).",
  inputSchema: z.object({
    toolName: z.string(),
    resourceType: z.string().optional(),
  }),
  callback: async (input, context) => {
    const state = getMapableState(context);
    await createAuditEvent({
      actorUserId: state.context.userId,
      action: "agent.tool.access",
      entityType: "AgentToolCall",
      entityId: state.runId,
      metadata: { toolName: input.toolName, resourceType: input.resourceType },
    });
    return { logged: true };
  },
});

export const createHumanApprovalRequest = tool({
  name: "create_human_approval_request",
  description: "Create a human approval request for a high-risk drafted action.",
  inputSchema: z.object({
    requestedAction: z.string().min(5),
    riskLevel: z.enum(["medium", "high", "critical"]).default("high"),
  }),
  callback: async (input, context) => {
    const state = getMapableState(context);
    const row = await prisma.agentApprovalRequest.create({
      data: {
        agentRunId: state.runId,
        requestedAction: input.requestedAction,
        riskLevel: input.riskLevel,
        requestedById: state.context.userId,
      },
    });
    state.requiresHumanConfirmation = true;
    state.actionStatus = "requires_human_review";
    return { approvalRequestId: row.id, status: "pending" };
  },
});
