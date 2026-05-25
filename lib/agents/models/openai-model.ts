import { OpenAIModel } from "@strands-agents/sdk/models/openai";

import { agentsConfig } from "@/lib/config/agents";

export function createOpenAIModel() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }
  return new OpenAIModel({
    modelId: agentsConfig.agentModelId ?? "gpt-4.1-mini",
    maxTokens: 4096,
    temperature: 0.2,
  });
}
