import { createOpenAI } from "@ai-sdk/openai";
import { tool, ToolLoopAgent, stepCountIs } from "ai";

import { mapableAgentConfig } from "@/lib/mapable-agent/config";
import { getOpenAiCompatibleModel } from "@/lib/mapable-agent/openai-client";
import type { MapableAgentIntent } from "@/lib/mapable-agent/types";
import { executeToolByName, getToolsForIntent } from "@/lib/mapable-agent/tools/registry";
import type { ToolContext } from "@/lib/mapable-agent/tools/types";

export function createMapableAgentTools(
  intent: MapableAgentIntent,
  ctx: ToolContext,
) {
  const defs = getToolsForIntent(intent);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools: Record<string, any> = {};

  for (const def of defs) {
    tools[def.name] = tool({
      description: def.description,
      inputSchema: def.inputSchema,
      execute: async (input: unknown) => {
        const result = await executeToolByName(def.name, ctx, input);
        if (!result.ok) {
          return { error: result.error, confidence: result.confidence };
        }
        return result.data ?? {};
      },
    });
  }

  return tools;
}

export function createMapableAgent(intent: MapableAgentIntent, ctx: ToolContext) {
  return new ToolLoopAgent({
    model: getOpenAiCompatibleModel(),
    instructions: `You are MapAble Agent. Use tools when helpful. Plain language only for participants.`,
    tools: createMapableAgentTools(intent, ctx),
    stopWhen: stepCountIs(mapableAgentConfig.maxSteps),
  });
}
