import { Agent } from "@strands-agents/sdk";
import { randomUUID } from "crypto";

import { agentsConfig } from "@/lib/config/agents";
import { prisma } from "@/lib/prisma";

import {
  completeAgentRun,
  createAgentRun,
  logAgentRunStart,
  persistAgentMessage,
} from "./agent-audit-service";
import { assertAgentConsentScopes, assertAgentsFeatureClosed } from "./agent-context";
import { AgentDisabledError } from "./agent-errors";
import { assertAgentPermissions } from "./agent-permissions";
import { resolveAgentId } from "./agents/orchestrator-agent";
import type {
  AgentActionStatus,
  AgentRunRequest,
  AgentRunResult,
  MapAbleAgentId,
  MapAbleInvocationState,
} from "./agent-types";
import { MAPABLE_INVOCATION_STATE_KEY } from "./agent-types";
import { getAgentConfig } from "./agent-registry";
import { MapableInterventionHandler } from "./guardrails/mapable-intervention-handler";
import { createAgentModel, resolveModelProvider } from "./models/model-provider";
import { resolveToolsForAgent } from "./tools";

export async function runMapableAgent(
  request: AgentRunRequest
): Promise<AgentRunResult> {
  assertAgentsFeatureClosed(request.context);

  if (!agentsConfig.agentsEnabled) {
    throw new AgentDisabledError();
  }

  const agentId = resolveAgentId(request.agentId, request.message);
  const config = getAgentConfig(agentId);

  assertAgentPermissions(agentId, request.context);
  if (config.requiresConsentScopes.length) {
    await assertAgentConsentScopes(
      request.context,
      config.requiresConsentScopes
    );
  }

  const conversationId =
    request.conversationId ??
    (await ensureConversation(request, agentId));

  const provider = resolveModelProvider();
  const run = await createAgentRun({
    agentId,
    context: request.context,
    conversationId,
    modelProvider: provider,
    modelId: agentsConfig.agentModelId,
  });

  await logAgentRunStart(request.context, agentId, run.id);

  const invocationState: MapAbleInvocationState = {
    context: request.context,
    runId: run.id,
    agentId,
    toolCalls: [],
    requiresHumanConfirmation: false,
    actionStatus: "drafted",
  };

  const started = Date.now();
  let responseText: string;

  try {
    if (provider === "mock" || !agentsConfig.agentToolExecutionEnabled) {
      responseText = buildMockResponse(agentId, request.message, invocationState);
    } else {
      const tools = resolveToolsForAgent(config.allowedTools);
      const strandsAgent = new Agent({
        model: createAgentModel(config.temperature),
        systemPrompt: config.systemPrompt,
        tools,
        interventions: [new MapableInterventionHandler()],
      });

      const result = await strandsAgent.invoke(request.message, {
        invocationState: {
          [MAPABLE_INVOCATION_STATE_KEY]: invocationState,
        },
      });

      responseText =
        typeof result === "string"
          ? result
          : result.toString?.() ?? "I have prepared a response for you.";
    }
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Agent run failed.";
    responseText = `I could not complete that request safely. ${message}`;
    invocationState.actionStatus = "blocked";
  }

  await persistAgentMessage({
    conversationId,
    role: "user",
    content: request.message,
  });
  await persistAgentMessage({
    conversationId,
    role: "assistant",
    content: responseText,
  });

  const actionStatus = deriveActionStatus(invocationState);
  const result: AgentRunResult = {
    agentId,
    response: responseText,
    toolCalls: invocationState.toolCalls,
    actionStatus,
    requiresHumanConfirmation: invocationState.requiresHumanConfirmation,
    runId: run.id,
    conversationId,
  };

  await completeAgentRun(run.id, result, Date.now() - started);
  return result;
}

function deriveActionStatus(state: MapAbleInvocationState): AgentActionStatus {
  if (state.actionStatus === "blocked") return "blocked";
  if (state.requiresHumanConfirmation) {
    return state.actionStatus === "requires_human_review"
      ? "requires_human_review"
      : "requires_confirmation";
  }
  return "drafted";
}

function buildMockResponse(
  agentId: MapAbleAgentId,
  message: string,
  state: MapAbleInvocationState
): string {
  const lower = message.toLowerCase();
  if (/approve.*invoice/i.test(lower)) {
    state.actionStatus = "blocked";
    state.requiresHumanConfirmation = true;
    return (
      "I cannot approve invoices. Please review and approve on the Invoices page, or ask an authorised nominee or plan manager with consent."
    );
  }
  if (/diagnos|treatment|prescribe/i.test(lower)) {
    state.actionStatus = "blocked";
    return (
      "I cannot make clinical decisions. I can help draft telehealth intake information for a practitioner to review."
    );
  }
  if (/close.*incident/i.test(lower)) {
    state.actionStatus = "requires_human_review";
    state.requiresHumanConfirmation = true;
    return "Closing an incident requires authorised staff review. I can help draft details for your report.";
  }
  if (/complain|incident|safeguard/i.test(lower)) {
    state.actionStatus = "requires_confirmation";
    return (
      "I can help you draft a complaint or incident report. Safeguarding matters are kept separate from general messages and need your confirmation before submission."
    );
  }
  if (/invoice|bill/i.test(lower)) {
    return (
      "I can explain invoices in plain language and flag validation issues. I cannot approve payments or submit NDIS claims."
    );
  }
  return `[${agentId}] I can explain, summarise and prepare drafts. Tell me more about what you need, and I will guide you to the right MapAble screen if action is required.`;
}

async function ensureConversation(
  request: AgentRunRequest,
  agentId: MapAbleAgentId
) {
  const conv = await prisma.agentConversation.create({
    data: {
      userId: request.context.userId,
      profileId: request.context.profileId,
      agentId,
      title: request.message.slice(0, 80),
    },
  });
  return conv.id;
}

export async function* streamMapableAgent(
  request: AgentRunRequest
): AsyncGenerator<
  | { type: "text"; delta: string }
  | { type: "tool"; toolName: string; status: string }
  | { type: "safety"; message: string }
  | { type: "done"; result: AgentRunResult }
> {
  if (!agentsConfig.agentStreamingEnabled) {
    const result = await runMapableAgent(request);
    yield { type: "text", delta: result.response };
    yield { type: "done", result };
    return;
  }

  const result = await runMapableAgent(request);
  const words = result.response.split(" ");
  for (const word of words) {
    yield { type: "text", delta: `${word} ` };
  }
  for (const tc of result.toolCalls) {
    yield { type: "tool", toolName: tc.toolName, status: tc.status };
  }
  if (result.requiresHumanConfirmation) {
    yield {
      type: "safety",
      message: "Needs your confirmation before any action is taken.",
    };
  }
  yield { type: "done", result };
}
