import { Agent } from "@strands-agents/sdk";

import { agentsConfig } from "@/lib/config/agents";

import type { AgentConfig } from "./agent-registry";
import { MapableInterventionHandler } from "./guardrails/mapable-intervention-handler";
import { createAgentModel } from "./models/model-provider";
import { resolveToolsForAgent } from "./tools";

export function buildMapableStrandsAgent(config: AgentConfig): Agent {
  const tools = agentsConfig.agentToolExecutionEnabled
    ? resolveToolsForAgent(config.allowedTools)
    : [];

  return new Agent({
    model: createAgentModel(config.temperature),
    systemPrompt: config.systemPrompt,
    tools,
    interventions: [new MapableInterventionHandler()],
  });
}
