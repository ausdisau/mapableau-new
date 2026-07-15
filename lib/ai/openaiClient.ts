import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

import {
  accessChatConfig,
  isOpenAiConfigured,
} from "@/lib/config/access-chat";

let openai: ReturnType<typeof createOpenAI> | null = null;

function getOpenAiProvider() {
  if (!isOpenAiConfigured()) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  if (!openai) {
    openai = createOpenAI({
      apiKey: accessChatConfig.openaiApiKey,
    });
  }
  return openai;
}

export function getOpenAiModel(
  modelId = accessChatConfig.openaiModel,
): LanguageModel {
  return getOpenAiProvider()(modelId);
}

export function getOpenAiEngineId(modelId = accessChatConfig.openaiModel): string {
  return `ai-sdk/openai/${modelId}`;
}

export function tryGetOpenAiModel(
  modelId = accessChatConfig.openaiModel,
): LanguageModel | null {
  if (!isOpenAiConfigured()) return null;
  return getOpenAiModel(modelId);
}
