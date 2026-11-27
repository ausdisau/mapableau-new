import { run } from "@openai/agents";

import type { AgentsSdkRunOutcome, MapAbleAgentsContext } from "./contracts";
import { createParticipantNavigatorManager } from "./manager";
import { recordSdkNavigatorTurn } from "./mapable-adapter";

export type RunAgentsSdkInput = {
  context: MapAbleAgentsContext;
  userMessage: string;
  /** When true, skip the LLM manager and only allow deterministic Access path callers. */
  dryRunPolicyOnly?: boolean;
};

/**
 * Execute one manager turn. Returns final text or blocked outcome.
 * Never returns raw RunState to clients — approval pauses use opaque ids (see approval.ts).
 */
export async function runMapAbleAgentsSdk(
  input: RunAgentsSdkInput,
): Promise<AgentsSdkRunOutcome> {
  const { context, userMessage } = input;

  if (context.aiOptedOut) {
    return {
      status: "blocked",
      reason: "MAPABLE_AGENT_AI_OPTED_OUT",
      toolsCalled: [],
    };
  }

  if (context.enabledDomains.length === 0) {
    return {
      status: "blocked",
      reason: "MAPABLE_AGENT_NO_ENABLED_DOMAINS",
      toolsCalled: [],
    };
  }

  if (input.dryRunPolicyOnly) {
    return {
      status: "completed",
      text: "Policy dry-run only — no model invocation.",
      toolsCalled: [],
      agentRunId: null,
    };
  }

  const manager = createParticipantNavigatorManager(context);

  try {
    const result = await run(manager, userMessage, {
      context,
    });

    const text =
      typeof result.finalOutput === "string"
        ? result.finalOutput
        : JSON.stringify(result.finalOutput ?? "");

    const { agentRunId } = await recordSdkNavigatorTurn({
      participantId: context.participantId,
      actorUserId: context.actorUserId,
      capabilityKey: context.capabilityKey,
      requestSummary: userMessage.slice(0, 500),
      outputSummary: {
        source: "agents-sdk",
        status: "completed",
        textPreview: text.slice(0, 300),
      },
      toolsCalled: ["consult_access_specialist"],
    });

    return {
      status: "completed",
      text,
      toolsCalled: ["consult_access_specialist"],
      agentRunId,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (
      message.startsWith("MAPABLE_AGENT_") ||
      message.startsWith("NAVIGATOR_")
    ) {
      return {
        status: "blocked",
        reason: message,
        toolsCalled: [],
      };
    }
    throw err;
  }
}
