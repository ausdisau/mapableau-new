import { createOpenAI } from "@ai-sdk/openai";

import { mapableAgentConfig } from "@/lib/mapable-agent/config";

function getOpenAiCompatibleModel() {
  const baseURL =
    mapableAgentConfig.modelProvider === "vllm"
      ? mapableAgentConfig.vllmBaseUrl
      : `${mapableAgentConfig.ollamaBaseUrl.replace(/\/$/, "")}/v1`;

  const apiKey =
    mapableAgentConfig.modelProvider === "vllm"
      ? mapableAgentConfig.vllmApiKey || "mapable-agent"
      : "mapable-agent";

  const client = createOpenAI({ baseURL, apiKey });
  return client(mapableAgentConfig.modelId);
}

export { getOpenAiCompatibleModel };
