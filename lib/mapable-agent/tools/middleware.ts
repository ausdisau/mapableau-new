import type { Prisma } from "@prisma/client";
import type { HumanReviewCategory } from "@prisma/client";
import { z } from "zod";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { mapableAgentConfig } from "@/lib/mapable-agent/config";
import type { ToolContext, ToolDefinition, ToolResult } from "@/lib/mapable-agent/tools/types";
import { hashToolInput } from "@/lib/mapable-agent/utils";
import { prisma } from "@/lib/prisma";

export async function wrapToolExecution(
  def: ToolDefinition,
  ctx: ToolContext,
  input: unknown,
): Promise<ToolResult> {
  const parsed = def.inputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.message, confidence: 0 };
  }

  const result = await def.execute(ctx, parsed.data);

  const sensitive = def.sensitivity === "sensitive" || def.sensitivity === "draft";
  const inputHash = hashToolInput(parsed.data);

  if (sensitive && ctx.actorUserId) {
    await createAuditEvent({
      actorUserId: ctx.actorUserId,
      action: "mapable_agent.tool_executed",
      entityType: "ToolExecutionLog",
      entityId: def.name,
      participantId: ctx.participantId ?? undefined,
      metadata: {
        toolName: def.name,
        inputHash,
        sensitive,
        confidence: result.confidence,
      },
    });
  }

  await prisma.toolExecutionLog.create({
    data: {
      sessionId: ctx.sessionId ?? null,
      agentRunId: ctx.agentRunId ?? null,
      toolName: def.name,
      inputHash,
      outputSummary: (result.data ?? undefined) as Prisma.InputJsonValue | undefined,
      confidence: result.confidence ?? null,
      sensitive,
    },
  });

  const lowConfidence =
    def.createsReviewOnLowConfidence &&
    (result.confidence ?? 1) < mapableAgentConfig.confidenceThreshold;

  if (lowConfidence || result.reviewCategory) {
    const task = await prisma.humanReviewTask.create({
      data: {
        sessionId: ctx.sessionId ?? null,
        agentRunId: ctx.agentRunId ?? null,
        participantId: ctx.participantId ?? null,
        category: result.reviewCategory ?? "low_confidence",
        title: `Review: ${def.name}`,
        summary: result.error ?? "Tool result needs human review before use.",
        context: { toolName: def.name, inputHash },
      },
    });
    return {
      ...result,
      data: { ...result.data, reviewTaskId: task.id },
    };
  }

  return result;
}

export function createHumanReviewTaskTool(): ToolDefinition {
  return {
    name: "createHumanReviewTask",
    description: "Create a human review task for staff follow-up",
    sensitivity: "read",
    inputSchema: z.object({
      category: z.enum([
        "privacy",
        "safeguarding",
        "payment",
        "provider_selection",
        "funding",
        "low_confidence",
      ]),
      title: z.string().min(1),
      summary: z.string().min(1),
      priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
    }),
    execute: async (ctx, input) => {
      const data = input as {
        category: HumanReviewCategory;
        title: string;
        summary: string;
        priority?: "low" | "normal" | "high" | "urgent";
      };
      const task = await prisma.humanReviewTask.create({
        data: {
          sessionId: ctx.sessionId ?? null,
          agentRunId: ctx.agentRunId ?? null,
          participantId: ctx.participantId ?? null,
          category: data.category,
          priority: data.priority ?? "normal",
          title: data.title,
          summary: data.summary,
        },
      });
      return { ok: true, data: { taskId: task.id }, confidence: 1 };
    },
  };
}

export function createLogAuditEventTool(): ToolDefinition {
  return {
    name: "logAuditEvent",
    description: "Log an audit event for agent activity",
    sensitivity: "sensitive",
    inputSchema: z.object({
      action: z.string().min(1),
      entityType: z.string().min(1),
      entityId: z.string().optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    }),
    execute: async (ctx, input) => {
      const data = input as {
        action: string;
        entityType: string;
        entityId?: string;
        metadata?: Record<string, unknown>;
      };
      if (!ctx.actorUserId) {
        return { ok: false, error: "Actor required for audit", confidence: 0 };
      }
      await createAuditEvent({
        actorUserId: ctx.actorUserId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        participantId: ctx.participantId ?? undefined,
        metadata: data.metadata,
      });
      return { ok: true, data: { logged: true }, confidence: 1 };
    },
  };
}
