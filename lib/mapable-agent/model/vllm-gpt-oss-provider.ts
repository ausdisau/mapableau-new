import { generateObject, generateText, streamText } from "ai";

import { mapableAgentConfig } from "@/lib/mapable-agent/config";
import {
  createOpenAiCompatibleClient,
  parseChatResult,
  SYSTEM_GUARDRAIL,
} from "@/lib/mapable-agent/model/shared";
import type {
  ChatParams,
  ChatResult,
  ChatStreamChunk,
  ModelProvider,
  StructuredParams,
} from "@/lib/mapable-agent/model/types";

export class VllmGptOssProvider implements ModelProvider {
  readonly id = "vllm" as const;
  private client = createOpenAiCompatibleClient(
    mapableAgentConfig.vllmBaseUrl,
    mapableAgentConfig.vllmApiKey || "mapable-agent",
  );

  async chat(params: ChatParams): Promise<ChatResult> {
    const result = await generateText({
      model: this.client(mapableAgentConfig.modelId),
      system: SYSTEM_GUARDRAIL,
      messages: params.messages.filter((m) => m.role !== "system"),
      maxOutputTokens: params.maxTokens ?? 2048,
    });
    return parseChatResult(result.text);
  }

  async *chatStream(params: ChatParams): AsyncIterable<ChatStreamChunk> {
    const stream = streamText({
      model: this.client(mapableAgentConfig.modelId),
      system: SYSTEM_GUARDRAIL,
      messages: params.messages.filter((m) => m.role !== "system"),
      maxOutputTokens: params.maxTokens ?? 2048,
    });

    let full = "";
    for await (const chunk of stream.textStream) {
      full += chunk;
      yield { type: "text-delta", text: chunk };
    }
    yield { type: "done", result: parseChatResult(full) };
  }

  async generateStructured<T>(params: StructuredParams<T>): Promise<T> {
    const result = await generateObject({
      model: this.client(mapableAgentConfig.modelId),
      system: SYSTEM_GUARDRAIL,
      messages: params.messages,
      schema: params.schema,
    });
    return result.object;
  }
}
