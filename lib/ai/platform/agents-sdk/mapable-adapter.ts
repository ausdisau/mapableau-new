import { Runner, type RunConfig } from "@openai/agents";

import { createAgentRun } from "@/lib/ai/agent-ops/agent-run-service";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { resolveModelForCapability } from "@/lib/ai/platform/models/gateway";

import type { MapAbleAgentRunContext } from "./contracts";
import { NAVIGATOR_AGENTS_SDK_CAPABILITY } from "./contracts";

export const MAPABLE_AGENTS_SDK_WORKFLOW = "MapAble Navigator Agents SDK";

/** Non-sensitive trace metadata only — never IDs or free text. */
export function buildTraceMetadata(ctx: MapAbleAgentRunContext): Record<string, string> {
  return {
    capabilityKey: ctx.capabilityKey,
    purpose: ctx.purpose,
    domains: ctx.enabledDomains.join(","),
  };
}

export function createMapAbleRunner(
  ctx?: MapAbleAgentRunContext,
): Runner {
  const runConfig: RunConfig = {
    tracingDisabled: false,
    traceIncludeSensitiveData: false,
    workflowName: MAPABLE_AGENTS_SDK_WORKFLOW,
    ...(ctx ? { traceMetadata: buildTraceMetadata(ctx) } : {}),
  };
  return new Runner(runConfig);
}

export function applyRunContextToRunner(
  runner: Runner,
  ctx: MapAbleAgentRunContext,
): Runner {
  runner.config.traceMetadata = buildTraceMetadata(ctx);
  runner.config.traceIncludeSensitiveData = false;
  return runner;
}

export type RecordAgentsSdkRunInput = {
  ctx: MapAbleAgentRunContext;
  toolsCalled: string[];
  guardrailsTriggered?: string[];
  status: "completed" | "interrupted" | "blocked";
  outputSummary?: Record<string, unknown>;
};

export async function recordAgentsSdkRun(
  input: RecordAgentsSdkRunInput,
): Promise<void> {
  await createAgentRun({
    agentType: "matching",
    participantId: input.ctx.participantId,
    actorUserId: input.ctx.actorUserId,
    inputSummary: {
      capabilityKey: input.ctx.capabilityKey,
      purpose: input.ctx.purpose,
      status: input.status,
    },
    outputSummary: input.outputSummary,
    toolsCalled: input.toolsCalled,
    guardrailsTriggered: input.guardrailsTriggered ?? [],
    riskTier: "medium",
    humanReviewRequired: input.status === "interrupted",
    participantConfirmationRequired: true,
  });

  await createAuditEvent({
    actorUserId: input.ctx.actorUserId,
    participantId: input.ctx.participantId,
    action: "agents_sdk.run.completed",
    entityType: "AiCapability",
    entityId: input.ctx.capabilityKey,
    metadata: {
      status: input.status,
      toolCount: input.toolsCalled.length,
    },
  });
}

export function resolveManagerModel(ctx: MapAbleAgentRunContext) {
  return resolveModelForCapability({
    capabilityKey: ctx.capabilityKey || NAVIGATOR_AGENTS_SDK_CAPABILITY,
    tenantId: ctx.tenantId,
  });
}

export function getDefaultRunConfig(ctx: MapAbleAgentRunContext): RunConfig {
  return {
    tracingDisabled: false,
    traceIncludeSensitiveData: false,
    workflowName: MAPABLE_AGENTS_SDK_WORKFLOW,
    traceMetadata: buildTraceMetadata(ctx),
  };
}
