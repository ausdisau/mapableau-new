import { createOpenAI } from "@ai-sdk/openai";
import { generateObject, generateText, streamText } from "ai";

import { mapableAgentConfig } from "@/lib/mapable-agent/config";
import type {
  ChatParams,
  ChatResult,
  ChatStreamChunk,
  ModelProvider,
  StructuredParams,
} from "@/lib/mapable-agent/model/types";
import { extractReasoningSummary } from "@/lib/mapable-agent/utils";

const SYSTEM_GUARDRAIL = `You are MapAble Agent for Australian NDIS participants and support coordinators.

Rules:
- Use plain, trauma-informed Australian English.
- You may explain, summarise, draft, classify and recommend only.
- You must NOT book, approve, pay, submit, send, cancel, disclose externally or escalate without human approval.
- Never expose raw chain-of-thought. Internal reasoning stays internal.
- Do not provide medical, legal or plan-management advice — signpost to qualified professionals.`;

function createOpenAiCompatibleClient(baseURL: string, apiKey = "mapable-agent") {
  return createOpenAI({ baseURL, apiKey });
}

function parseChatResult(text: string, reasoning?: string): ChatResult {
  return {
    text: text.trim(),
    reasoningSummary: extractReasoningSummary(reasoning),
    confidence: 0.85,
  };
}

export class OllamaGptOssProvider implements ModelProvider {
  readonly id = "ollama" as const;
  private client = createOpenAiCompatibleClient(
    `${mapableAgentConfig.ollamaBaseUrl.replace(/\/$/, "")}/v1`,
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

export class VllmGptOssProvider implements ModelProvider {
  readonly id = "vllm" as const;
  private client = createOpenAiCompatibleClient(mapableAgentConfig.vllmBaseUrl);

  async chat(params: ChatParams): Promise<ChatResult> {
    const result = await generateText({
      model: mapableAgentConfig.modelId,
      system: SYSTEM_GUARDRAIL,
      messages: params.messages.filter((m) => m.role !== "system"),
      maxOutputTokens: params.maxTokens ?? 2048,
    });
    return parseChatResult(result.text);
  }

  async *chatStream(params: ChatParams): AsyncIterable<ChatStreamChunk> {
    const stream = streamText({
      model: mapableAgentConfig.modelId,
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
      model: mapableAgentConfig.modelId,
      system: SYSTEM_GUARDRAIL,
      messages: params.messages,
      schema: params.schema,
    });
    return result.object;
  }
}
