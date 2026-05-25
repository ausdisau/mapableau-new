import type { Model } from "@strands-agents/sdk";

import { agentsConfig } from "@/lib/config/agents";
import { AgentModelUnavailableError } from "../agent-errors";
import { createBedrockModel } from "./bedrock-model";
import { createOpenAIModel } from "./openai-model";

export type ModelProviderKind = "bedrock" | "openai" | "mock";

export function resolveModelProvider(): ModelProviderKind {
  return agentsConfig.agentProvider;
}

export function createAgentModel(temperature?: number): Model {
  const provider = resolveModelProvider();

  if (provider === "mock") {
    throw new AgentModelUnavailableError();
  }

  if (provider === "openai") {
    try {
      return createOpenAIModel();
    } catch {
      throw new AgentModelUnavailableError();
    }
  }

  if (provider === "bedrock") {
    try {
      return createBedrockModel({ temperature: temperature ?? 0.2 });
    } catch {
      throw new AgentModelUnavailableError();
    }
  }

  throw new AgentModelUnavailableError();
}
