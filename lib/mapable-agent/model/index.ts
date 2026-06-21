export { OllamaGptOssProvider, VllmGptOssProvider } from "@/lib/mapable-agent/model/ollama-gpt-oss-provider";
export type {
  ChatParams,
  ChatResult,
  ChatStreamChunk,
  ModelProvider,
  ModelProviderId,
} from "@/lib/mapable-agent/model/types";

import { mapableAgentConfig } from "@/lib/mapable-agent/config";
import {
  OllamaGptOssProvider,
  VllmGptOssProvider,
} from "@/lib/mapable-agent/model/ollama-gpt-oss-provider";
import type { ModelProvider } from "@/lib/mapable-agent/model/types";

let cachedProvider: ModelProvider | null = null;

export function getMapableAgentModelProvider(): ModelProvider {
  if (cachedProvider) return cachedProvider;
  cachedProvider =
    mapableAgentConfig.modelProvider === "vllm"
      ? new VllmGptOssProvider()
      : new OllamaGptOssProvider();
  return cachedProvider;
}

export function resetMapableAgentModelProviderForTests(): void {
  cachedProvider = null;
}
