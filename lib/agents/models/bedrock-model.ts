import { BedrockModel, type BedrockModelConfig } from "@strands-agents/sdk";

import { agentsConfig } from "@/lib/config/agents";

export function createBedrockModel(overrides?: Partial<BedrockModelConfig>) {
  const region = process.env.AWS_REGION ?? "ap-southeast-2";
  const modelId =
    agentsConfig.agentModelId ??
    "anthropic.claude-sonnet-4-20250514-v1:0";

  return new BedrockModel({
    region,
    modelId,
    maxTokens: 4096,
    temperature: 0.2,
    ...overrides,
  });
}
