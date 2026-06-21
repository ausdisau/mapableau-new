import type { z } from "zod";

export type ModelProviderId = "ollama" | "vllm";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatParams = {
  messages: ChatMessage[];
  tools?: Record<string, unknown>;
  maxTokens?: number;
};

export type ChatResult = {
  text: string;
  reasoningSummary?: string;
  toolCalls?: Array<{ name: string; arguments: Record<string, unknown> }>;
  confidence?: number;
};

export type ChatStreamChunk =
  | { type: "text-delta"; text: string }
  | { type: "reasoning-summary"; text: string }
  | { type: "done"; result: ChatResult };

export type StructuredParams<T> = {
  schema: z.ZodType<T>;
  messages: ChatMessage[];
  description?: string;
};

export interface ModelProvider {
  readonly id: ModelProviderId;
  chat(params: ChatParams): Promise<ChatResult>;
  chatStream(params: ChatParams): AsyncIterable<ChatStreamChunk>;
  generateStructured<T>(params: StructuredParams<T>): Promise<T>;
}
